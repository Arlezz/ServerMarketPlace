const { Router } = require('express');
const router = Router();
const bcrypt = require('bcryptjs');
const mysqlConnection = require('../database');


router.post("/login",  (req,res) =>{
    const email = req.body.email;
    const password = req.body.password;
    //var passwordHashed =  await bcrypt.hash(password,15);
    //console.log(passwordHashed);    
    //console.log(verificaCredenciales(email,password));
    verificaCredenciales(email,password, function(err,data){
        if(!err){
            if(data){
                console.log("ENTREER")
                res.json({
                    message:"AUTENTICACION EXITOSA",
                });
            }else{
                res.json({
                    message:"INGRESE CORRECTAMENTE LAS CREDENCIALES"
                })
            }
        }
    });
});

function verificaCredenciales(email, password,callback){
    mysqlConnection.query('SELECT * FROM usuarios WHERE email = ?', [email], function (err,rows,fields){
        if(!err){
            try{
                const compare = bcrypt.compareSync(password,rows[0].password);
                callback(null,rows[0].email == email && compare);
            }catch(e){
                callback(null,false);
            }
        } else{
            callback(err,null);
        }
    });
}

router.get("/compare", async (req,res) =>{
    const hashSave = "$2a$09$XOKc8TkimZfffu8IM/Z3SeMk/mPOddqNYmyuKhOZJm8OxSM3FVCVC";
    const compare = bcrypt.compareSync("12345",hashSave);

    if(compare){
        res.json("ok");
    }else{
        res.json("no son iguales");
    }

} )


module.exports = router;