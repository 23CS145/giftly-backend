const express=require('express')
const mongoose=require('mongoose')
const {v4:uuidv4}=require('uuid')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
const cors=require('cors')
const authMiddleware = require("./middleware/auth");

const app=express()
app.use(express.json())
app.use(cors())

mongoose.connect('mongodb+srv://saranya:sara123@cluster21.tubv8.mongodb.net/giftly')
.then(()=>console.log("Connected to MongoDB"))
.catch((err)=>console.log("Connection failed",err))

const userSchema=new mongoose.Schema({
    user_id:{type:String,required:true,unique:true},
    username:{type:String,required:true},
    password:{type:String,required:true},
    email:{type:String,required:true,unique:true}
})

const User=mongoose.model("User",userSchema)

const productSchema = new mongoose.Schema({
  product_id: { type: String, required: true, unique: true },
  product_name: { type: String, required: true },
  image_url: { type: String, required: true },
  new_price: { type: Number, required: true },
  old_price: { type: Number, required: true },  
  category: { type: String, required: true },
  description: { type: String, required: true }
});

const Products=mongoose.model("Products",productSchema)

const cartSchema=new mongoose.Schema({
    cart_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    product_id: { type: String, required: true },
    quantity: { type: Number, required: true }
})
const Cart=mongoose.model("Cart",cartSchema)

app.post('/signup',async(req,res)=>{
  try{
  const {username,email,password,confirm_password}=req.body
  if(!username|| !email || !password || !confirm_password){
    return res.status(400).json({message:"All fields are required"})
  }
  if(password!==confirm_password){
    return res.status(400).json({message:"Passwords do not match"})
  }
  const user=await User.findOne({email})
  if(user){
    return res.status(400).json({message:"User already exists"})
  }
    const hashedPassword=await bcrypt.hash(password,10)
    const newUser=new User({
      user_id:uuidv4(),
      username,
      password: hashedPassword,
      email
    })
    await newUser.save();
    return res.status(201).json({message:'User registered successfully'})
  }catch(error){
    return res.status(500).json({message:"Internal Server error"})
  }
})

app.post("/login", async (req, res) => {
    try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({success: false, message: "Invalid credentials"  });
      }
      const isValidPassword=await bcrypt.compare(password,user.password)
      if(!isValidPassword){
        return res.status(400).json({success: false, message: "Invalid credentials" });
      }
      const token=jwt.sign({user_id:user.user_id},"My_secret",{expiresIn:'1h'})
      return res.status(200).json({ success: true, token, user })
    } catch(error) {
      console.error(error)
        return res.status(500).json({ success: false, message: "Internal Server Error"});
    }})

    app.post("/api/products", async (req, res) => {
      try {
        const { product_name, image_url, new_price,old_price,category,description } = req.body;
        if (!product_name || !image_url  || !new_price || !old_price|| !category || !description) {
          return res.status(400).json({ message: "All fields are required" });
        }
        const newProduct = new Products({
          product_id: uuidv4(),
          product_name,
          image_url,
          new_price,
          old_price,          
          category,
          description,
        });
        await newProduct.save();
        return res.status(201).json(newProduct);
      } catch (error) {
        console.error("Error saving product:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
      }
    });

 app.get("/api/products",async (req, res) => {
  console.log(req.user)
    try {
        const products = await Products.find();
        return res.status(200).json(products);
        } catch {
        return res.status(500).json({ message: "Internal Server Error" });
     }
})

 app.post("/api/carts", async (req, res) => {
    try {
      const { user_id, product_id, quantity } = req.body;
      const existingCartItem = await Cart.findOne({ user_id, product_id });
      if (existingCartItem) {
        existingCartItem.quantity += quantity; 
        await existingCartItem.save();
        return res.status(200).json(existingCartItem);
      }
      const newCart = new Cart({
        cart_id: uuidv4(),
        user_id,
        product_id,
        quantity
      });
      await newCart.save();
      res.status(201).json(newCart);
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });
  

  app.get("/api/carts/:user_id",authMiddleware, async (req, res) => {
    console.log(req.user)
    try {
      const cartItems = await Cart.find({ user_id: req.params.user_id });
      return res.status(200).json(cartItems);
    } catch {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  })

  app.put("/api/user/:user_id",async(req,res)=>{
    try{
    const {username,password}=req.body
    if(!username || !password){
      return res.status(400).json({message:'All fields are required'})
    }
    const hashedPassword=await bcrypt.hash(password,10)
    const updatedUser=await User.findOneAndUpdate(
      {user_id:req.params.user_id},
      {
        username,
       password:hashedPassword},
      {new:true}
    )
    if(!updatedUser){
      return res.status(400).json({message:"User not found"})
    }
    return res.status(200).json({message:"User details Updated successfully",updatedUser})
  }catch(error){
    return res.status(500).json({message:"Internal Server error"})
  }
  })

  app.put('/api/products/:product_id',async(req,res)=>{
    try{
    const {product_name,description,price,image_url}=req.body
    const updatedProduct=await Products.findOneAndUpdate(
      {product_id:req.params.product_id},
      {product_name,
      image_url,
      new_price,
      old_price,
      category,
      description},      
      {new:true}
    )
    if(!updatedProduct){
      return res.status(400).json({message:"Product not found"})
    }
    return res.status(200).json({message:"Product Updated successfully",updatedProduct})
  }catch(error){
    return res.status(500).json({message:"Internal server error"})
  }
  })

  app.put('/api/carts/:cart_id',async(req,res)=>{
    try{
    const {quantity}=req.body
    const updatedCart=await Cart.findOneAndUpdate(
      {cart_id:req.params.cart_id},
      {quantity},
      {new:true}
    )
    if(!updatedCart){
      return res.send(400).json({message:"Cart item not found"})
    }
    return res.send(200).json({message:"Cart updated succesfully"})
  }catch(error){
    return res.send(500).json({message:"Internal server error"})
  }
  })
 
  app.delete('/api/user/:user_id',async (req,res)=>{
    const {user_id}=req.params;
    try{
      const deletedUser=await User.findOneAndDelete({user_id})
      if(!deletedUser){
        return res.status(404).json({message:"User not found"})
      }
      res.status(200).json({message:"User deleted successfully"})
    }catch(error){
      return res.status(500).json({message:"Internal server error"})
    }
  })

app.delete("/api/carts/:cart_id", async (req, res) => {
  try {
    const { cart_id } = req.params;
    const cartItem = await Cart.findOne({ cart_id });
    if (!cartItem) {
      return res.status(400).json({ message: "Cart item not found" });
    }
    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;
      await cartItem.save();
      return res.status(200).json({ message: "Cart item quantity reduced", cartItem });
    }
    await Cart.findOneAndDelete({ cart_id });
    return res.status(200).json({ message: "Cart item deleted successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(3000,()=>{
    console.log("Server is running")
})
