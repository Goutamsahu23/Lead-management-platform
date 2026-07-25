const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Note = require('../models/Note');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');
const { logActivity, listActivitiesForLead } = require('./activityService');
const { getUserById } = require('./userService');

function isAdmin(user) {
  return user.role === 'admin';
}

function assigneeIdOf(lead) {
  if (!lead.assignedTo) return null;
  return (lead.assignedTo._id || lead.assignedTo).toString();
}

function assertCanAccessLead(user, lead) {
  if (isAdmin(user)) return;
  const assigneeId = assigneeIdOf(lead);
  if (!assigneeId || assigneeId !== user._id.toString()) {
    throw new AppError('You do not have permission to access this lead', 403);
  }
}

function populateLead(query) {
  return query.populate('assignedTo', 'name email role');
}

async function createLead(payload, actor = null) {
  let assignedTo = null;
  let assigneeDoc = null;

  if (actor) {
    if (actor.role === 'member') {
      assignedTo = actor._id;
      assigneeDoc = actor;
    } else if (payload.assignedTo) {
      assigneeDoc = await getUserById(payload.assignedTo);
      assignedTo = assigneeDoc._id;
    }
  }

  const lead = await Lead.create({
    name: payload.name,
    email: payload.email,
    phone: payload.phone || '',
    company: payload.company || '',
    source: payload.source || (actor ? 'manual' : 'website'),
    status: 'new',
    assignedTo,
  });

  await logActivity({
    leadId: lead._id,
    actorId: actor ? actor._id : null,
    type: 'created',
    meta: {
      source: lead.source,
      name: lead.name,
      email: lead.email,
    },
  });

  if (assignedTo && actor) {
    await logActivity({
      leadId: lead._id,
      actorId: actor._id,
      type: 'assigned',
      meta: {
        from: null,
        to: assignedTo.toString(),
        fromName: null,
        toName: assigneeDoc.name,
      },
    });
  }

  return populateLead(Lead.findById(lead._id));
}

async function listLeads(user, query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (!isAdmin(user)) {
    filter.assignedTo = user._id;
  } else if (query.assignedTo) {
    if (query.assignedTo === 'unassigned') {
      filter.assignedTo = null;
    } else if (mongoose.isValidObjectId(query.assignedTo)) {
      filter.assignedTo = query.assignedTo;
    }
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.q) {
    const q = query.q.trim();
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { company: new RegExp(q, 'i') },
    ];
  }

  const [data, total] = await Promise.all([
    populateLead(Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
    Lead.countDocuments(filter),
  ]);

  return buildPaginatedResponse({ data, total, page, limit });
}

async function getLeadById(user, leadId) {
  const lead = await populateLead(Lead.findById(leadId));
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }
  assertCanAccessLead(user, lead);
  return lead;
}

async function updateLead(user, leadId, payload) {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }
  assertCanAccessLead(user, lead);

  if (payload.assignedTo !== undefined) {
    if (!isAdmin(user)) {
      throw new AppError('Only admins can assign leads', 403);
    }

    const previousAssignee = lead.assignedTo ? lead.assignedTo.toString() : null;
    let previousName = null;
    if (previousAssignee) {
      const prev = await User.findById(previousAssignee).select('name');
      previousName = prev?.name || null;
    }

    let nextAssignee = null;
    let nextName = null;

    if (payload.assignedTo === null || payload.assignedTo === '') {
      nextAssignee = null;
    } else {
      const assignee = await getUserById(payload.assignedTo);
      nextAssignee = assignee._id;
      nextName = assignee.name;
    }

    const nextStr = nextAssignee ? nextAssignee.toString() : null;
    if (previousAssignee !== nextStr) {
      lead.assignedTo = nextAssignee;
      await logActivity({
        leadId: lead._id,
        actorId: user._id,
        type: 'assigned',
        meta: {
          from: previousAssignee,
          to: nextStr,
          fromName: previousName,
          toName: nextName,
        },
      });
    }
  }

  if (payload.status !== undefined && payload.status !== lead.status) {
    const from = lead.status;
    lead.status = payload.status;
    await logActivity({
      leadId: lead._id,
      actorId: user._id,
      type: 'status_changed',
      meta: { from, to: payload.status },
    });
  }

  const editableFields = ['name', 'email', 'phone', 'company', 'source'];
  for (const field of editableFields) {
    if (payload[field] !== undefined) {
      lead[field] = payload[field];
    }
  }

  await lead.save();
  return populateLead(Lead.findById(lead._id));
}

async function deleteLead(user, leadId) {
  if (!isAdmin(user)) {
    throw new AppError('Only admins can delete leads', 403);
  }

  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  await Promise.all([
    Note.deleteMany({ leadId: lead._id }),
    require('../models/Activity').deleteMany({ leadId: lead._id }),
    lead.deleteOne(),
  ]);

  return { message: 'Lead deleted' };
}

async function addNote(user, leadId, body) {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }
  assertCanAccessLead(user, lead);

  const note = await Note.create({
    leadId: lead._id,
    authorId: user._id,
    body,
  });

  await logActivity({
    leadId: lead._id,
    actorId: user._id,
    type: 'note_added',
    meta: {
      noteId: note._id.toString(),
      preview: body.slice(0, 120),
    },
  });

  return Note.findById(note._id).populate('authorId', 'name email role');
}

async function listNotes(user, leadId) {
  await getLeadById(user, leadId);
  return Note.find({ leadId }).sort({ createdAt: -1 }).populate('authorId', 'name email role');
}

async function listActivities(user, leadId) {
  await getLeadById(user, leadId);
  return listActivitiesForLead(leadId);
}

async function getDashboardStats(user) {
  const filter = isAdmin(user) ? {} : { assignedTo: user._id };
  const [total, byStatus, unassigned] = await Promise.all([
    Lead.countDocuments(filter),
    Lead.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    isAdmin(user) ? Lead.countDocuments({ assignedTo: null }) : Promise.resolve(0),
  ]);

  const statusCounts = {
    new: 0,
    contacted: 0,
    qualified: 0,
    won: 0,
    lost: 0,
  };
  for (const row of byStatus) {
    statusCounts[row._id] = row.count;
  }

  return { total, statusCounts, unassigned };
}

module.exports = {
  createLead,
  listLeads,
  getLeadById,
  updateLead,
  deleteLead,
  addNote,
  listNotes,
  listActivities,
  getDashboardStats,
  assertCanAccessLead,
};
