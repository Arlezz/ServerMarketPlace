const { Router } = require('express');
const router = Router();
const { v4: uuidv4 } = require('uuid');
const mysqlConnection = require('../database');
const UsernameGenerator = require('username-generator');

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

//Devuelve el uuid por medio del email
router.get('/email/:email', (req, res) => {
    const { email } = req.params;
    mysqlConnection.query('SELECT * FROM usuarios WHERE email = ?', [email], (err,rows,fields) =>{
        if(!err){
            try{
                res.json(rows[0].id);
            }catch(e){
                res.json("Id Unknown");
            }
        } else{
            console.log(err);
        }
    });
    
});

//Crea nuevos usuarios
router.post('/:token',(req, res) => {
    const { name, lastname, rut, email, password } = req.body;
    const { token } = req.params;
    var uuid = uuidv4();
    var rol = "usuario";
    var username = UsernameGenerator.generateUsername();
    
    while(verificaUsuario(username)){
        username = UsernameGenerator.generateUsername();
    }
    
    const query = `
        SET @id = ?;
        SET @token = ?;
        SET @rol = ?;
        SET @username = ?;
        SET @name = ?;
        SET @lastname = ?;
        SET @rut = ?;
        SET @email = ?;
        SET @password = ?;
        CALL usuarioAdd(@id,@token,@rol, @username, @name, @lastname, @rut, @email, @password);
    `;
    mysqlConnection.query(query, [uuid,token,rol,username, name, lastname, rut, email, password], (err, rows, fields) =>{
        if(!err){
            res.json({status: "Usuario guardado",
            id:uuid,
            token:token,
            rol:rol,
            username:username,
            name:name,
            lastname:lastname,
            rut:rut,
            email:email,
            password:password});
        }else{
            console.log(err);
        }
    });
});


//Actualiza solo el username
router.put('/username/:id', (req, res) => {
    const { username } = req.body;
    const { id } = req.params;
    
    const query = 'CALL usernameEdit(?,?)';
    
    mysqlConnection.query(query, [id,username], (err, rows, fields) =>{
        if(!err){
            res.json({status: "Username actualizado",
            id:id,
            username:username});
        }else{
            console.log(err);
        }
    });
});

router.put('/adress/:region/:comuna/:numero',(req,res) => {
    const {} = req.body;


});

//Actualiza solo el email
router.put('/email/:id', (req, res) => {
    const { email } = req.body;
    const { id } = req.params;
    
    const query = 'CALL emailEdit(?,?)';
    
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

//Actualiza solo la contraseña
router.put('/password/:id', (req, res) => {
    const { password } = req.body;
    const { id } = req.params;
    
    const query = 'CALL passwordEdit(?,?)';
    
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
    const query = 'CALL usuarioEditPersonalInformation(?,?,?,?,?,?,?,?,?,?,?,?)';
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

//Actualiza todos los datos del usuario (ADMINISTRADOR)
router.put('/:id', (req, res) => {
    const { username,name, lastname, rut, email, password,region,comuna,calle,numero,telefono} = req.body;
    const { id } = req.params;
    const query = 'CALL usuarioEdit(?,?,?,?,?,?,?,?,?,?,?,?)';
    mysqlConnection.query(query, [id,username, name, lastname, rut, email, password,region,comuna,calle,numero,telefono], (err, rows, fields) =>{
        if(!err){
            res.json({status: "Usuario actualizado",
            id:id,
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
function verificaUsuario(username){
    mysqlConnection.query('SELECT * FROM usuarios WHERE username = ?', username,(err,rows,fields) =>{
        if(!err){
            try{
                if(rows[0].username == username){
                    return true;
                }
            }catch(e){
                return false;
            }
        } else{
            console.log(err);
        }
    });
}

module.exports = router;