const { Router } = require('express');
const router = Router();
const Notificacion = require('../notification');


const cellFisico = "fsDjhzwIRdaKsfN_eyDd8i:APA91bHprnqfpYoFB6Ib9VbD1ehp7ScRG4xwgoecpBAipBnRMYP52Tich8vbqkbQKv2ac2p1o41d9cHkwV7ZM2c0QNxYaj1eTt6PWaZ7iQ8fyDRXzdoXmNNCVPVicF-LT7JPEv0hA7Ed";
const emulador = "dscfsiIDTLel8snYrnkXiG:APA91bFdS05VzjPfqLJUSXWTfzbsMEO6GtIn6CNdpq8rwjI7uM72tTZfgXZ6DkH4G8FlV2lG47NuVVlwGaBKjh58JFDGXsJBvJqAIJW_F5SdByftBUcxXZcyZNzcELjsShEhlbYbFt5M";


router.get("/one-user", function(req, res){
    
    const { userSell } = req.body; 

    const data = {
        tokenId: userSell,
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