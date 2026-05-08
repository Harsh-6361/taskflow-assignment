import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { MemberRole, Role, ProjectStatus } from '../types/enums';

/**
 * Create a new project
 * @route POST /api/projects
 * @access Private (ADMIN or TEAM_LEADER only)
 */
export const createProject = async (req: Request, res: Response): Promise<any> => {
  const { name, description } = req.body;
  const ownerId = req.user?.uid;

  if (!ownerId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    // Check if user has permission to create projects (ADMIN or TEAM_LEADER)
    const userDoc = await db.collection('users').doc(ownerId).get();
    const userData = userDoc.data();

    if (!userDoc.exists || (userData?.role !== Role.ADMIN && userData?.role !== Role.TEAM_LEADER)) {
      return res.status(403).json({ error: 'Access denied: Only Admins or Team Leaders can create projects' });
    }

    const projectRef = db.collection('projects').doc();
    const projectData = {
      id: projectRef.id,
      name,
      description: description || '',
      ownerId,
      status: ProjectStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await projectRef.set(projectData);

    // Create member record for the owner
    const memberRef = db.collection('projectMembers').doc(`${projectRef.id}_${ownerId}`);
    await memberRef.set({
      id: memberRef.id,
      projectId: projectRef.id,
      userId: ownerId,
      role: MemberRole.ADMIN,
      joinedAt: new Date().toISOString(),
    });

    return res.status(201).json({
      ...projectData,
      memberCount: 1
    });
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ error: 'Error creating project' });
  }
};

/**
 * Get all projects for the authenticated user
 * @route GET /api/projects
 * @access Private
 */
export const getAllProjects = async (req: Request, res: Response): Promise<any> => {
  const userId = req.user?.uid;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Get projects where user is a member
    const memberSnap = await db.collection('projectMembers')
      .where('userId', '==', userId)
      .get();
    
    const projectIds = memberSnap.docs.map(doc => doc.data().projectId);

    if (projectIds.length === 0) {
      return res.json([]);
    }

    // Firestore 'in' query is limited to 10-30 items, but for now we'll assume it's okay
    // or we fetch them one by one/in chunks if needed.
    const projectsSnap = await db.collection('projects')
      .where('id', 'in', projectIds)
      .get();

    const projects = await Promise.all(projectsSnap.docs.map(async (doc) => {
      const data = doc.data();
      // Get member count for each project
      const countSnap = await db.collection('projectMembers')
        .where('projectId', '==', data.id)
        .count()
        .get();
      
      return {
        ...data,
        memberCount: countSnap.data().count
      };
    }));

    // Sort by createdAt desc manually
    projects.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json(projects);
  } catch (error) {
    console.error('Get all projects error:', error);
    return res.status(500).json({ error: 'Error fetching projects' });
  }
};

/**
 * Get project by ID
 * @route GET /api/projects/:id
 * @access Private
 */
export const getProjectById = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const userId = req.user?.uid;

  try {
    const projectDoc = await db.collection('projects').doc(id as string).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = projectDoc.data();

    // Check membership
    const memberDoc = await db.collection('projectMembers').doc(`${id}_${userId}`).get();
    if (!memberDoc.exists) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this project' });
    }

    // Get all members
    const membersSnap = await db.collection('projectMembers')
      .where('projectId', '==', id)
      .get();
    
    const projectMembers = await Promise.all(membersSnap.docs.map(async (mDoc) => {
      const mData = mDoc.data();
      const uDoc = await db.collection('users').doc(mData.userId).get();
      const uData = uDoc.data();
      return {
        ...mData,
        user: {
          id: uData?.id,
          name: uData?.name,
          email: uData?.email
        }
      };
    }));

    // Task stats
    const tasksSnap = await db.collection('tasks').where('projectId', '==', id).get();
    const taskStats = tasksSnap.docs.reduce((acc: any, tDoc) => {
      const status = tDoc.data().status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      ...projectData,
      projectMembers,
      taskStats,
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    return res.status(500).json({ error: 'Error fetching project' });
  }
};

/**
 * Update project details
 */
export const updateProject = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { name, description, status } = req.body;
  const userId = req.user?.uid;

  try {
    const memberDoc = await db.collection('projectMembers').doc(`${id}_${userId}`).get();
    if (!memberDoc.exists || memberDoc.data()?.role !== MemberRole.ADMIN) {
      return res.status(403).json({ error: 'Only project administrators can update project details' });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    updateData.updatedAt = new Date().toISOString();

    await db.collection('projects').doc(id as string).update(updateData);

    const updatedDoc = await db.collection('projects').doc(id as string).get();
    return res.json(updatedDoc.data());
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({ error: 'Error updating project' });
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const userId = req.user?.uid;

  try {
    const projectDoc = await db.collection('projects').doc(id as string).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (projectDoc.data()?.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the project owner can delete the project' });
    }

    // In Firestore, we have to manually delete sub-collections/related docs
    // Batch delete members and tasks
    const batch = db.batch();
    
    const membersSnap = await db.collection('projectMembers').where('projectId', '==', id).get();
    membersSnap.forEach(doc => batch.delete(doc.ref));

    const tasksSnap = await db.collection('tasks').where('projectId', '==', id).get();
    tasksSnap.forEach(doc => batch.delete(doc.ref));

    batch.delete(db.collection('projects').doc(id as string));

    await batch.commit();

    return res.json({ message: 'Project and all related data deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({ error: 'Error deleting project' });
  }
};

/**
 * Get all members of a project
 */
export const getProjectMembers = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const userId = req.user?.uid;

  try {
    const memberDoc = await db.collection('projectMembers').doc(`${id}_${userId}`).get();
    if (!memberDoc.exists) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this project' });
    }

    const membersSnap = await db.collection('projectMembers')
      .where('projectId', '==', id)
      .get();
    
    const projectMembers = await Promise.all(membersSnap.docs.map(async (mDoc) => {
      const mData = mDoc.data();
      const uDoc = await db.collection('users').doc(mData.userId).get();
      const uData = uDoc.data();
      return {
        ...mData,
        user: {
          id: uData?.id,
          name: uData?.name,
          email: uData?.email
        }
      };
    }));

    return res.json(projectMembers);
  } catch (error) {
    console.error('Get project members error:', error);
    return res.status(500).json({ error: 'Error fetching project members' });
  }
};

/**
 * Add a member to a project
 */
export const addProjectMember = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { email, role } = req.body;
  const adminId = req.user?.uid;

  try {
    const adminMemberDoc = await db.collection('projectMembers').doc(`${id}_${adminId}`).get();
    if (!adminMemberDoc.exists || adminMemberDoc.data()?.role !== MemberRole.ADMIN) {
      return res.status(403).json({ error: 'Only project administrators can add members' });
    }

    const userSnap = await db.collection('users').where('email', '==', email).get();
    if (userSnap.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userToAdd = userSnap.docs[0].data();
    const memberId = `${id}_${userToAdd.id}`;

    const existingDoc = await db.collection('projectMembers').doc(memberId).get();
    if (existingDoc.exists) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }

    const newMember = {
      id: memberId,
      projectId: id,
      userId: userToAdd.id,
      role: role || MemberRole.MEMBER,
      joinedAt: new Date().toISOString(),
    };

    await db.collection('projectMembers').doc(memberId).set(newMember);

    return res.status(201).json({
      ...newMember,
      user: {
        id: userToAdd.id,
        name: userToAdd.name,
        email: userToAdd.email
      }
    });
  } catch (error) {
    console.error('Add project member error:', error);
    return res.status(500).json({ error: 'Error adding project member' });
  }
};

/**
 * Remove a member from a project
 */
export const removeProjectMember = async (req: Request, res: Response): Promise<any> => {
  const { id, userId } = req.params;
  const adminId = req.user?.uid;

  try {
    const adminMemberDoc = await db.collection('projectMembers').doc(`${id}_${adminId}`).get();
    if (!adminMemberDoc.exists || adminMemberDoc.data()?.role !== MemberRole.ADMIN) {
      return res.status(403).json({ error: 'Only project administrators can remove members' });
    }

    const projectDoc = await db.collection('projects').doc(id as string).get();
    if (projectDoc.data()?.ownerId === userId) {
      return res.status(400).json({ error: 'Cannot remove the project owner from the project' });
    }

    await db.collection('projectMembers').doc(`${id}_${userId}`).delete();

    return res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove project member error:', error);
    return res.status(500).json({ error: 'Error removing project member' });
  }
};

/**
 * Update a member's role
 */
export const updateMemberRole = async (req: Request, res: Response): Promise<any> => {
  const { id, userId } = req.params;
  const { role } = req.body;
  const adminId = req.user?.uid;

  try {
    const adminMemberDoc = await db.collection('projectMembers').doc(`${id}_${adminId}`).get();
    if (!adminMemberDoc.exists || adminMemberDoc.data()?.role !== MemberRole.ADMIN) {
      return res.status(403).json({ error: 'Only project administrators can update roles' });
    }

    const projectDoc = await db.collection('projects').doc(id as string).get();
    if (projectDoc.data()?.ownerId === userId) {
      return res.status(400).json({ error: 'Cannot change the role of the project owner' });
    }

    await db.collection('projectMembers').doc(`${id}_${userId}`).update({ role });

    const updatedDoc = await db.collection('projectMembers').doc(`${id}_${userId}`).get();
    const uDoc = await db.collection('users').doc(userId as string).get();
    
    return res.json({
      ...updatedDoc.data(),
      user: {
        id: uDoc.data()?.id,
        name: uDoc.data()?.name,
        email: uDoc.data()?.email
      }
    });
  } catch (error) {
    console.error('Update member role error:', error);
    return res.status(500).json({ error: 'Error updating member role' });
  }
};
