//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://varshaj666:test123@cluster0.fjayy22.mongodb.net/todolistDB", () => {
  console.log('connected to database todolistDb server')
});

const itemsSchema = {
  name: String
}
//schema representation of items.
const Item = mongoose.model("Item", itemsSchema);
//singular version of items=>Item and specify schema of repr

const item1 = new Item({
  name: "Welocme to TodoList"
});
const item2 = new Item({
  name: "Add item by clicking on '+'button"
});
const item3 = new Item({
  name: "<-- press this button if u want to delete "
});
//Add the default documents(items) to ur Items collections
const defaultItems = [item1, item2, item3];
//list schema is created for customizedpage user requests for
const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  //in findall method will return foundItems as an array
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully added default items to Item model");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  })
});

//To make customized route page we require route parameters.
app.get("/:customListName", function(req, res) {
  //i am continously facing issue when u simply refresh route page it access listname to favicon.ico so to avoid that if statemnt
  if (req.params.customListName != "favicon.ico") {
  const customListName = _.capitalize(req.params.customListName);
  //in findone method we return foundList as an document
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err)
    {
      if (!foundList)
      {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+ customListName);
        //we need to redirect to any customized name page requested by user
      } else
       {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
       }
    }
  })
 }
});



app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  //here we get iten name use tries to add
  const listName= req.body.list;
  //here we get list name requested by user when he clicks submit + button in /customListName route
  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    //if user tries in same route of home page it will just add item and redirect to get method of home route and render list to UI
    item.save();
    res.redirect("/");
  }else{
    //here if user tries to add items to customlistname route ,we push new item to foundlist and save ,redirec to get method of cutsomname route.
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }

});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("successfully deleted checkeditem");
        res.redirect("/");
      }
    })
  }
  //here if loop we check for list name is today then we just delete by checkingid and redirect to home route to render list
  else {
    //in else loop if listname is custom listname (query)the u need to pull the item by validating itemchedked Id (update)and redirect to /listname to render list
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundList) {
      if(!err){
        res.redirect("/" + listName);
      }
    })
  }

});

app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port == ""){
  port=3000;
}

app.listen(port, function() {
  console.log("Server has started on port 3000");
});
