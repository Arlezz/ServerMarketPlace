const { Router } = require('express');
const router = Router();
const bcrypt = require('bcryptjs');
const mysqlConnection = require('../database');
const { default: fetch } = require('node-fetch');
const { values } = require('underscore');
const urlCategoria = "https://api.mercadolibre.com/sites/MLC/categories";
const urlSubcategoria = "https://api.mercadolibre.com/categories/";
const urlRegionesChile = "https://api.mercadolibre.com/classified_locations/countries/CL";
const urlComunasPorRegion = "https://api.mercadolibre.com/classified_locations/states/";


router.post("/login",  (req,res) =>{
    const email = req.body.email;
    const password = req.body.password;
    
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
});

//Devuelve todos las categorias
router.get('/product/categories', (req, res) => {
    fetch(urlCategoria)
        .then(response => response.json())
        .then(data => {
            //const categories = new Array(data.length);
            for(let i = 0; i < data.length;i++){
                data[i].imagen = "categorias ("+(i+1)+").jpg";
            }
            //console.log(categories);
            res.json(data)
        })  
        .catch(err => console.log(err));
});

//Devuelve todos las subcategorias por id categoria
router.post('/product/subcategories', (req, res) => {
    const { id } = req.body;
    fetch(urlSubcategoria + id)
    .then(response => response.json())
    .then(value => {
        const subcategorie = new Array(value.children_categories.length);
        for (let i = 0; i < value.children_categories.length; i++) {
            subcategorie[i] = value.children_categories[i].name;
        }
        res.json(subcategorie)
    })
    .catch(err => console.log(err));
});

//Devuelve todos las regiones de chile
router.get('/app/regiones', (req, res) => {
    fetch(urlRegionesChile)
        .then(response => response.json())
        .then(data => {
            let regiones = [];
            console.log(regiones.length);
            for(let i = 0; i < data.states.length;i++){
                if(data.states[i].name == "Inglaterra" || data.states[i].name == "USA" || data.states[i].name == "China"){
                    continue;
                }
                regiones[i] = data.states[i];
            }
            res.json(regiones.filter(function (el) {
                return el != null;
            }));
        })  
        .catch(err => console.log(err));
});

//Devuelve todos las comunas por id region
router.post('/app/comunas', (req, res) => {
    const { id } = req.body;
    console.log(id)
    fetch(urlComunasPorRegion + id)
    .then(response => response.json())
    .then(value => {
        const comunas =[];
        for (let i = 0; i < value.cities.length; i++) {
            comunas[i] = value.cities[i].name;
        }
        res.json(comunas);
    })
    .catch(err => console.log(err));
});

module.exports = router;