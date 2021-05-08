const { Router } = require('express');
const router = Router();
const mysqlConnection = require('../database');
const intformat = require('biguint-format')
     ,FlakeId = require('flake-idgen');

var flakeIdGen = new FlakeId({ epoch: 1300000000000 });
 
//Devuelve todos los productos
router.get('/', (req, res) =>{
    mysqlConnection.query('SELECT * FROM products', (err, rows, fields) =>{
        if(!err){
            res.json(rows);
        } else{
            console.log(err);
        }
    });
});


//Devuelve producto por id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    mysqlConnection.query('SELECT * FROM products WHERE id = ?', [id], (err,rows,fields) =>{
        if(!err){
            res.json(rows[0]);
        } else{
            console.log(err);
        }
    });
    
});

//Devuelve todos los productos de un usuario por idPropietario
router.get('/owner/:owner', (req, res) =>{
    const { owner } = req.params;
    mysqlConnection.query('SELECT * FROM products WHERE propietario = ?',[owner] ,(err, rows, fields) =>{
        if(!err){
            res.json(rows);
        } else{
            console.log(err);
        }
    });
});


//Crea un producto
router.post('/',(req, res) => {
    const {propietario,titulo,categoria,subcategoria,descripcion,condicion,stock,precio,precioEnvio,region,comuna} = req.body;
    var idProduct = intformat(flakeIdGen.next(), 'hex', { prefix: '0x' }); 
    var nro_publicacion = getRandomInt(10000000,90000000);
    
    while(verificaNroPublicacion(nro_publicacion)){
        nro_publicacion = getRandomInt(10000000,90000000)
    }

    const query = 'CALL productAdd(?,?,?,?,?,?,?,?,?,?,?,?,?)';
    mysqlConnection.query(query, [propietario,idProduct,nro_publicacion,titulo,categoria,subcategoria,descripcion,condicion,stock,precio,precioEnvio,region,comuna], (err, rows, fields) =>{
        if(!err){
            res.json({status: "Producto guardado",
            propietario:propietario,
            idProduct:idProduct,
            nro_publicacion:nro_publicacion,
            titulo:titulo,
            categoria:categoria,
            subcategoria:subcategoria,
            condicion:condicion,
            stock:stock,
            precio:precio,
            precioEnvio:precioEnvio,
            region:region,
            comuna:comuna});
        }else{
            console.log(err);
        }
    });
});


//Actualiza un producto
router.put('/:id', (req, res) => {
    const { titulo,descripcion, condicion,stock,precio,precioEnvio} = req.body;
    const { id } = req.params;
    console.log(id);
    const query = 'CALL productEdit(?,?,?,?,?,?,?)';
    mysqlConnection.query(query, [id,titulo,descripcion, condicion,stock,precio,precioEnvio], (err, rows, fields) =>{
        if(!err){
            res.json({status: "Producto actualizado",
            id:id,
            titulo:titulo,
            descripcion:descripcion,
            condicion:condicion,
            stock:stock,
            precio:precio,
            precioEnvio:precioEnvio});
        }else{
            console.log(err);
        }
    });
});


//Elimina un producto
router.delete('/:id',(req, res) => {
    const { id } = req.params;
    mysqlConnection.query('DELETE FROM products WHERE id= ?', [id], (err, rows, fields) =>{
        if(!err){
            res.json({status: "Producto eliminado"});
        }else{
            console.log(err);
        }

    });
});

//Crea el numero de publicacion
function getRandomInt(min,max){
    return Math.floor(min + Math.random() * max);
}


//Verifica si el username ya existe
function verificaNroPublicacion(nro_publicacion){
    mysqlConnection.query('SELECT * FROM products WHERE nro_publicacion = ?', nro_publicacion,(err,rows,fields) =>{
        if(!err){
            try{
                if(rows[0].nro_publicacion == nro_publicacion){
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