const { Router } = require('express');
const router = Router();
const Notificacion = require('../notification');


router.post("/buy-product", function(req, res){
    
    try {
        const { token, tituloProducto} = req.body; 

        const data = {
            tokenId: token,
            title: "¡Realizaste una venta!",
            body: "Tu producto "+tituloProducto+" acaba de ser comprado"
        }
        Notificacion.sentPushToOneUser(data);
        res.status(200).send("Enviando notificación.");
    } catch (error) {
        console.log("usuario desconectado")
        res.status(200).send("Enviando notificación");
    }

    
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