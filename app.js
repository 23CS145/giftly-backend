const express=require('express')
const mongoose=require('mongoose')
const {v4:uuidv4}=require('uuid')

const app=express()
app.use(express.json())

mongoose.connect('mongodb+srv://saranya:sara123@cluster21.tubv8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster21/giftly')
.then(()=>console.log("Connected to MongoDB"))
.catch((err)=>console.log("Connection failed",err))

const userSchema=new mongoose.Schema({
    user_id:{type:String,required:true,unique:true},
    username:{type:String,required:true},
    password:{type:String,required:true},
    email:{type:String,required:true,unique:true}
})

const User=mongoose.model("User",userSchema)

const productSchema=new mongoose.Schema({
    product_id: { type: String, required: true, unique: true },
    product_name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image_url: { type: String, required: true }
})
const Products=mongoose.model("Products",productSchema)

const cartSchema=new mongoose.Schema({
    cart_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    product_id: { type: String, required: true },
    quantity: { type: Number, required: true }
})
const Cart=mongoose.model("Cart",cartSchema)

app.post('/api/users/signup',async(req,res)=>{
    try{
    const{username,password,email}=req.body
    const newUser=new User({user_id:uuidv4(),username,password,email})
    const savedUser=await newUser.save()
    res.status(201).json(newUser)
    }catch(err){
        res.status(404).send({message:'Internal Server error'})
    }
})

app.post("/api/users/login", async (req, res) => {
    try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
        res.status(200).json(user);
    } catch {
        res.status(500).json({ message: "Internal Server Error" });
    }})

 app.get("/api/products", async (req, res) => {
    try {
        const products = await Products.find();
        res.status(200).json(products);
        } catch {
        res.status(500).json({ message: "Internal Server Error" });
     }
})

app.post("/api/products", async (req, res) => {
    try {
      const { product_name, description, price, image_url } = req.body;
      if (!product_name || !description || !price || !image_url) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const newProduct = new Products({
        product_id: uuidv4(),
        product_name,
        description,
        price,
        image_url
      });
      await newProduct.save();
      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Error saving product:", error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  

  app.post("/api/carts", async (req, res) => {
    try {
      const { user_id, product_id, quantity } = req.body;
      const newCart = new Cart({
        cart_id: uuidv4(),
        user_id,
        product_id,
        quantity
      });
      await newCart.save();
      res.status(201).json(newCart);
    } catch {
      res.status(500).json({ message: "Internal Server Error" });
    }
  })

  app.get("/api/carts/:user_id", async (req, res) => {
    try {
      const cartItems = await Cart.find({ user_id: req.params.user_id });
      res.status(200).json(cartItems);
    } catch {
      res.status(500).json({ message: "Internal Server Error" });
    }
  })

app.listen(3000,()=>{
    console.log("Server is running")
})
