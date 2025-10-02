const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Firestore trigger - audit when service is created/updated/deleted
exports.logServiceChange = functions.firestore
  .document('services/{svcId}')
  .onWrite(async (change, context) => {
    const svcId = context.params.svcId;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;
    const event = {
      path: `services/${svcId}`,
      before,
      after,
      eventType: change.after.exists ? (change.before.exists ? 'updated' : 'created') : 'deleted',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    await admin.firestore().collection('logs').add(event);
    console.log('Service change logged', svcId);
    return null;
});

// Firestore trigger - when application created/updated
exports.logApplicationChange = functions.firestore
  .document('applications/{appId}')
  .onWrite(async (change, context) => {
    const appId = context.params.appId;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;
    const event = {
      path: `applications/${appId}`,
      before,
      after,
      eventType: change.after.exists ? (change.before.exists ? 'updated' : 'created') : 'deleted',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    await admin.firestore().collection('logs').add(event);
    console.log('Application change logged', appId);
    return null;
});
