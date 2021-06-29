const { Router } = require('express');
const router = Router();
const { v4: uuidv4 } = require('uuid');
const mysqlConnection = require('../database');
const { default: fetch } = require('node-fetch');

const urlProducts = "http://localhost:3000/api/products/";



router.post("/add",(req, res) => {
    const { userId, product, cantidadComprada } = req.body;
    const id = uuidv4();
    const query = "CALL shoppingCartAdd(?,?,?,?)";
    mysqlConnection.query(query,[id,userId,product,cantidadComprada], (err, rows, fields) => {
        if(!err){
            res.status(200).send("Agregado al carrito");
        } else{
            res.status(500).send("Ocurrio un error");
        }
    });
});

router.get("/:idUser",(req, res) =>{
    const { idUser } = req.params;
    const query = "SELECT * FROM shopping_cart WHERE userId = ?";

    mysqlConnection.query(query,[idUser], (err, rows, fields) => {
        if(!err){
            (async () => {
                res.json(await llenaConProductos(rows));
            })();
        } else{
            res.status(500).send("Ocurrio un error");
        }
    });
});

router.delete("/delete/:id", (req,res) =>{
    const { id } = req.params;
    const query = "DELETE FROM shopping_cart WHERE id = ?";
    mysqlConnection.query(query,[id], (err, rows, fields) =>{
        if(!err){
                res.status(200).send("Eliminado del carrito")
        } else{
            res.status(500).send("Ocurrio un error");
        }
    });
});

router.get("/exist/:id", (req,res) =>{
    const { id } = req.params;
    const query = "SELECT * FROM shopping_cart WHERE product = ?";
    mysqlConnection.query(query,[id], (err, rows, fields) =>{
        if(!err){
            try {
                if(rows[0].product == id){
                    res.status(200).send("Existe en carrito")
                }else{
                    res.status(418).send("I'm a teapot")
                }
            } catch (error) {
                res.status(418).send("I'm a teapot")
            }
        } else{
            res.status(500).send("Ocurrio un error");
        }
    });
});

router.delete("/clear/user/:id", (req,res) =>{
    const { id } = req.params;
    const query = "DELETE FROM shopping_cart WHERE userId = ?";
    mysqlConnection.query(query,[id], (err, rows, fields) =>{
        if(!err){
            res.status(200).send("Carrito limpio")
    } else{
        res.status(500).send("Ocurrio un error");
    }
    });
});

function llenaConProductos(objeto){
    return new Promise((resolve, reject) => {
        (async () => {
            for(let i = 0; i < objeto.length; i++){
                objeto[i].product = await retornaProducto(objeto[i].product);
            }
            return resolve(objeto);
        })();
    });
}


function retornaProducto(id){
    return new Promise((resolve, reject) => {
        fetch(urlProducts + id)
        .then(response => response.json())
        .then(value => {
            return resolve(value);
        })
        .catch(err => console.log(err));
    });
}


module.exports = router;