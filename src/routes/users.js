const { Router } = require('express');
const router = Router();
const { v4: uuidv4 } = require('uuid');
const mysqlConnection = require('../database');
const UsernameGenerator = require('username-generator');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../res/users/'));
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    //rechaza un archivo
    if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});



router.get('/asd', async (req, res) =>{//para generar contraseñas 
    console.log(await bcrypt.hash("000",15));
});


//Devuelve json con todos los usuarios existentes
router.get('/', (req, res) =>{
    mysqlConnection.query('SELECT * FROM usuarios', (err, rows, fields) =>{
        if(!err){
            res.json(rows);
        } else{
            console.log(err);
        }
    });
});

//Devuelve usuario buscado por id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    mysqlConnection.query('SELECT * FROM usuarios WHERE id = ?', [id], (err,rows,fields) =>{
        if(!err){
            res.json(rows[0]);
        } else{
            console.log(err);
        }
    });
    
});

router.put('/image/:id',upload.single('userImage'), (req,res) =>{
    console.log(req.file)
    const { id } = req.params;
    const userImage = req.file;
    console.log("id: "+id);
    const query = 'CALL usuarioEditImage(?,?)';
    mysqlConnection.query(query, [id,userImage.filename], (err, rows, fields) =>{
        if(!err){
            res.json({status: "Imagen actualizada",
            id:id,
            userImage:userImage.filename});
        }else{
            console.log(err);
        }
    });

});

//Devuelve el usuario por medio del email *para el loogin*
router.get('/email/:email', (req, res) => {
    const { email } = req.params;
    mysqlConnection.query('SELECT * FROM usuarios WHERE email = ?', [email], (err,rows,fields) =>{
        if(!err){
            try{
                res.json(rows[0]);
            }catch(e){
                res.json("Id Unknown");
            }
        } else{
            console.log(err);
        }
    });
    
});

//Crea nuevos usuarios 
router.post('/', async (req, res) => {
    const { name, lastname, rut, email, password } = req.body;
    var uuid = uuidv4();
    var rol = "usuario";
    if(!name || !rut|| !email|| !password){
        res.json({
            message:"Sometsomething went wrong"
        });
        return;
    }
    var username = UsernameGenerator.generateUsername();
    var passwordHashed =  await bcrypt.hash(password,15);
    (async () => {
        while(await verificaUsuario(username)){
            username = UsernameGenerator.generateUsername();
        }
        console.log(username);
        const query = `
            SET @id = ?;
            SET @rol = ?;
            SET @username = ?;
            SET @name = ?;
            SET @lastname = ?;
            SET @rut = ?;
            SET @email = ?;
            SET @password = ?;
            CALL usuarioAdd(@id,@rol, @username, @name, @lastname, @rut, @email, @password);
        `;
        mysqlConnection.query(query, [uuid,rol,username, name, lastname, rut, email, passwordHashed], (err, rows, fields) =>{
            if(!err){
                res.json({status: "Usuario guardado",
                id:uuid,
                rol:rol,
                username:username,
                name:name,
                lastname:lastname,
                rut:rut,
                email:email,
                password:passwordHashed});
            }else{
                console.log(err);
            }
        });
    })();
});


//Permite al usuario Logearse
router.post("/login",  (req,res) =>{
    const email = req.body.email;
    const password = req.body.password;
    const token = req.body.token;
    if(!email || !password){
        res.json({
            message:"Sometsomething went wrong"
        });
        return;
    }
    verificaCredenciales(email,password, function(err,data){
        if(!err){
            if(data){
                insertaTokenUser(token,email);
                res.json({
                    message:"Logueado correctamente",
                    email:email
                });
            }else{
                res.status(500).send('Ingrese correctamente las credenciales');
            }
        }
    });
});

router.put("/logout",(req,res)=>{
    const id = req.body.id;
    if(!id){
        res.json({
            message:"Sometsomething went wrong"
        });
        return;
    }
    const query = "UPDATE usuarios SET token = NULL WHERE id = ?";
    mysqlConnection.query(query,[id],(err,rows,fields)=>{
        if(!err){
            res.json({
                message: "Successful exit"
            });
         } else{
            res.status(500).send("Wrong exit");
         }
    });

});

function insertaTokenUser(token,email){
    mysqlConnection.query('UPDATE usuarios SET token=? WHERE email=?', [token,email],(err,rows,fields)=>{
        if(!err){
           console.log("token insertado correctamente");
        } else{
           console.log("el token no se inserto correctamente");
        }
    });
}

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


//Actualiza solo el username
router.put('/username/:id', (req, res) => {
    const { username } = req.body;
    const { id } = req.params;
    if(!username){
        res.json({
            message:"Sometsomething went wrong"
        });
        return;
    } 
    const query = 'CALL usuarioEditUsername(?,?)';
    mysqlConnection.query(query, [id,username], (err, rows, fields) =>{
        if(!err){
            res.json({status: "Username actualizado",
            id:id,
            username:username});
        }else{
            res.status(500).send("Error al actualizar");
        }
    });
});

router.put('/adress/:id',(req,res) => {
    const { region, comuna, calle, numero, telefono } = req.body;
    const { id } = req.params;
    if(!region || !comuna || !calle ||!numero || !telefono){
        res.json({
            message:"Sometsomething went wrong"
        });
        return;
    }
    const query = 'CALL usuarioEditAdress(?,?,?,?,?,?)';
    mysqlConnection.query(query, [id,region,comuna,calle,numero,telefono], (err, rows, fields) =>{
        if(!err){
            res.json({status: "Direccion agregada",
            id:id,
            region:region,
            comuna:comuna,
            calle:calle,
            numero:numero,
            telefono:telefono});
        }else{
            console.log(err);
        }
    });
});

//Actualiza el email
router.put('/email/:id', (req, res) => {
    const { email } = req.body;
    const { id } = req.params;
    if(!email){
        res.json({
            message:"Sometsomething went wrong"
        });
        return;
    } 
    const query = 'CALL usuaruiEditEmail(?,?)';
    mysqlConnection.query(query, [id,email], (err, rows, fields) =>{
        if(!err){
            res.json({status: "Email actualizado",
            id:id,
            email:email});
        }else{
            console.log(err);
        }
    });
});

//Actualiza la contraseña
router.put('/password/:id', (req, res) => {
    const { password } = req.body;
    const { id } = req.params;
    if(!password){
        res.json({
            message:"Sometsomething went wrong"
        });
        return;
    } 
    const query = 'CALL usuarioEditPassword(?,?)';
    mysqlConnection.query(query, [id,password], (err, rows, fields) =>{
        if(!err){
            res.json({status: "Password actualizado",
            id:id,
            password:password});
        }else{
            console.log(err);
        }
    });
});

//Actualiza los datos PERSONALES del usuario (ADMINISTRADOR)
router.put('/:id', (req, res) => {
    const { name, lastname, rut, email, password,region,comuna,calle,numero,telefono} = req.body;
    const { id } = req.params;
    if(!name || !lastname || !rut || !email || !password || !region || !comuna || !calle || !numero || !telefono){
        res.json({
            message:"Sometsomething went wrong"
        });
        return;
    } 

    const query = 'CALL usuarioEditPersonalInformation(?,?,?,?,?)';
    mysqlConnection.query(query, [id,name, lastname, rut,telefono], (err, rows, fields) =>{
        if(!err){
            res.json({status: "Usuario actualizado",
            id:id,
            name:name,
            lastname:lastname,
            rut:rut,
            telefono:telefono});
        }else{
            console.log(err);
        }
    });
});

//Actualiza TODOS los datos del usuario (ADMINISTRADOR)
router.put('/:id', (req, res) => {
    const { token,rol,username,name, lastname, rut, email, password,region,comuna,calle,numero,telefono} = req.body;
    const { id } = req.params;
    const query = 'CALL usuarioEditAll(?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
    mysqlConnection.query(query, [id,token,rol,username, name, lastname, rut, email, password,region,comuna,calle,numero,telefono], (err, rows, fields) =>{
        if(!err){
            res.json({status: "Usuario actualizado Completamente",
            id:id,
            token:token,
            rol:rol,
            username:username,
            name:name,
            lastname:lastname,
            rut:rut,
            email:email,
            password:password,
            region:region,
            comuna:comuna,
            calle:calle,
            numero:numero,
            telefono:telefono});
        }else{
            console.log(err);
        }
    });
});


//Elimina un usuario (funcion de administrador)
router.delete('/:id',(req, res) => {
    const { id } = req.params;
    mysqlConnection.query('DELETE FROM usuarios WHERE id= ?', [id], (err, rows, fields) =>{
        if(!err){
            res.json({status: "Usuario eliminado"});
        }else{
            console.log(err);
        }

    });
});


//Verifica si el username ya existe
function verificaUsuario(username,callback){
    return new Promise((resolve, reject)=>{
        mysqlConnection.query('SELECT * FROM usuarios WHERE username = ?',[username] ,function (err,rows,fields){
            try{
                return err ? reject(err) : resolve(rows[0].username == username);
            }catch(e){
                return resolve(false);
            }
            
        });

    });
}

module.exports = router;