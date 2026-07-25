const Activity = require('../models/Activity');
const User = require('../models/User');

async function logActivity({ leadId, actorId = null, type, meta = {} }) {
  return Activity.create({
    leadId,
    actorId,
    type,
    meta,
  });
}

async function listActivitiesForLead(leadId) {
  const activities = await Activity.find({ leadId })
    .sort({ createdAt: -1 })
    .populate('actorId', 'name email role')
    .lean();

  const assigneeIds = activities
    .filter((activity) => activity.type === 'assigned')
    .flatMap((activity) => [activity.meta?.from, activity.meta?.to])
    .filter(Boolean);

  if (assigneeIds.length === 0) {
    return activities;
  }

  const users = await User.find({ _id: { $in: assigneeIds } }).select('name').lean();
  const namesById = new Map(users.map((user) => [user._id.toString(), user.name]));

  return activities.map((activity) => {
    if (activity.type !== 'assigned') {
      return activity;
    }

    return {
      ...activity,
      meta: {
        ...activity.meta,
        fromName:
          activity.meta?.fromName ||
          (activity.meta?.from ? namesById.get(String(activity.meta.from)) : null),
        toName:
          activity.meta?.toName ||
          (activity.meta?.to ? namesById.get(String(activity.meta.to)) : null),
      },
    };
  });
}

module.exports = { logActivity, listActivitiesForLead };
