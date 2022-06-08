const express = require ('express');
const bodyParser = require ('body-parser');
const date = require (__dirname + '/date.js') 
//const request = require ('request');
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs'); 

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

//connexion à la bd mongoDB Atlas
mongoose.connect("mongodb+srv://admin-ConcepteurJS:zozoplus18@cluster0.mbt9c.mongodb.net/todolistDB", {useNewUrlParser: true});
//mongodb+srv://admin-ConcepteurJS:<password>@cluster0.mbt9c.mongodb.net/databaseName
//mongodb://localhost:27017

const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

let defaultItems = [];

const listSchema = new mongoose.Schema ({
    name: String,
    items: [itemsSchema]
});

const List = mongoose.model("List", listSchema)


// get list.ejs + les variables day et items
app.get("/", function (req, res) {

    let day = date.getDate();

    Item.find({}, function(err, items) {
        if(err) {
            console.log(err);
        } else {
            res.render('list', {listTitle: "Today", newListItems: items });
        } //listTitle : day

    });

});

app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
    
    List.findOne({name : customListName}, function(err, foundList) {
        if(!err) {
           if(!foundList) {
               //create a new list
               const list = new List ({
                    name: customListName,
                    items: defaultItems
                });

                list.save();                
                res.redirect('/' + customListName)
                //list.save();
           } else {
               // show the found list
               res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
           }
        }
    });

});


app.post('/', function(req, res) {
    
    const listName = req.body.list;
    const nItem = req.body.newItem;

    const item = new Item({
        name : nItem
    });

    if(listName === "Today") {

        if(nItem!=="") {
            item.save();
            res.redirect('/');
        } else {
            res.redirect('/');
        }

    } else{

        if(nItem !== "") {
            List.findOne({name: listName}, function(err, foundItem) {
                foundItem.items.push(item);
                foundItem.save();
                res.redirect('/'+ listName);
            });
            
        }else {
            res.redirect('/'+ listName);
        }
    }
});

app.post('/delete', function(req, res) {

    // nous permet de recupérer l'attribut "value" de nos input checkbox & listName
    const checkId = req.body.checkbox;

    const listName = req.body.listName;
    // l'élément récupéré correspond au nom de l'element que 
    //l'utilisateur va selectionner pour supprimmer   

    if (listName === "Today") {
        Item.findOneAndDelete({_id: checkId}, function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("succefully deleted!");
                res.redirect('/');
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkId}}}, function(err, foundList) {
            if(!err){ 
                res.redirect("/" + listName);
            }    
        });
    };
    
});


app.listen(4000, function() {
    console.log("server start on port 4000");
}); 

