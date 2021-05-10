const { Router } = require('express');
const router = Router();
const Notificacion = require('../notification');


const cellFisico = "fsDjhzwIRdaKsfN_eyDd8i:APA91bHprnqfpYoFB6Ib9VbD1ehp7ScRG4xwgoecpBAipBnRMYP52Tich8vbqkbQKv2ac2p1o41d9cHkwV7ZM2c0QNxYaj1eTt6PWaZ7iQ8fyDRXzdoXmNNCVPVicF-LT7JPEv0hA7Ed";
const emulador = "cy7fSV4WTI2Robw3OQLY-6:APA91bGibel1slttRPzIZx6IxA0mam-CPSYULdBPHHGLizmgQymO_jsN39zvsbxT4SwiD7Y-TBVrL7UeefSsSr5btKWZJhmkT5ttQ8-dgse3TyuxFUteSAG719U7znzeA8jy4G9J2-9E";


router.get("/one-user", function(req, res){
    
    const { userSell } = req.body; 

    const data = {
        tokenId: emulador,
        title: "Supermercado Libre",
        body: "Tu producto fue comprado"
    }
    Notificacion.sentPushToOneUser(data);
    res.send("Sending Notification to One user....");
});


router.get("/topic", function(req, res){
    res.send("Sending Notification to topic");
    const data = {
        topic: "test",
        title: "Re:codigo",
        body: "Mensaje desde node js hacia topic test"
    }
    Notificacion.sendPushToTopic(data);
});

router.get("/",function(req, res){
    res.send("Success");
});



module.exports = router;