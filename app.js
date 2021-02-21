const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Workout 30 min"
});
const item2 = new Item({
    name: "Breakfast"
});
const item3 = new Item({
    name: "Work Work Work"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name:String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
    Item.find({}, function(err, result){
        if (result.length === 0) {
            Item.insertMany(defaultItems, function(err){
                if (err) { 
                    console.log(err);
                } else {
                    console.log("Success :D");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {listTitle : "Today", listItems: result});            
        }
    });
});


app.get("/about", function(req, res){
    res.render("about");
});

app.post("/", function(req, res){

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const newItem = new Item({
        name: itemName
    });

    if (listName === "Today") {
        newItem.save();
        res.redirect("/");        
    } else {
        List.findOne({name: listName}, function(err, results){
            results.items.push(newItem);
            results.save();
            res.redirect("/" + listName);
        });
    }
});

app.get("/:customList", function(req, res){

    const customList = _.capitalize(req.params.customList);

    List.findOne({name: customList}, function(err, result){
        if (!err) {
            if (!result) {
                //Create a new list
                const list = new List({
                    name: customList,
                    items: defaultItems
                })
                list.save();
                res.redirect("/" + customList);

            } else {
                //Show existing list
                res.render("list", {listTitle: result.name, listItems: result.items});
            }
        }
    });
});

app.post("/delete", function(req, res){
    const checkedBoxId = req.body.checkbox;
    const listName = req.body.listName;
    
    if (listName === "Today") {
        Item.findByIdAndRemove(checkedBoxId, function(err){
            if (!err){
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id:checkedBoxId}}}, function (err, result) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }
});

app.listen(3000, function(){
    console.log("running on port 3000");
});
