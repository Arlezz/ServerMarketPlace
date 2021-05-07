const { response } = require("express");
const admin = require("firebase-admin");


/*function initFirebase(){
    const serviceAccount = require(__dirname+"/keys/marketplace-a179d-firebase-adminsdk-azdpk-3f9ba8d00d.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}
initFirebase();*/


const serviceAccount = require(__dirname+"/keys/marketplace-a179d-firebase-adminsdk-azdpk-3f9ba8d00d.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

function sentPushToOneUser(notificacion){
    const message = {
        token: notificacion.tokenId,
        data: {
            title: notificacion.title,
            body: notificacion.body
        }
    }
    console.log(notificacion.tokenId+"\n"+notificacion.title+"\n"+notificacion.body+"\n")
    sendMessage(message);
}

function sendPushToTopic(notificacion){
    const message = {
        topic: notificacion.topic,
        data: {
            title: notificacion.title,
            body: notificacion.body
        }
    }
    //console.log(notificacion.topic+"\n"+notificacion.title+"\n"+notificacion.body+"\n")
    sendMessage(message);
}

module.exports = {sentPushToOneUser,sendPushToTopic}

function sendMessage(message){
    admin.messaging().send(message)
        .then((response)=>{
            console.log("Successfully send message",response);
        })
        .catch((error)=>{
            console.log("Error senging message",error)
        })
}