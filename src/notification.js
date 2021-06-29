const { response } = require("express");
const admin = require("firebase-admin");


function initFirebase(){
    const serviceAccount = require(__dirname+"/keys/marketplaceproyect-bf427-firebase-adminsdk-rn5uo-d55f3d0348.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}
initFirebase();


function sentPushToOneUser(notificacion){
    const message = {
        token: notificacion.tokenId,
        data: {
            title: notificacion.title,
            body: notificacion.body
        }
    }
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