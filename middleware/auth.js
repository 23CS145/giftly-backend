const jwt=require('jsonwebtoken')
const authMiddleware=(req,res,next)=>{
  const token=req.header('Authorization')?.split(" ")[1]
  if(!token){
    return res.status(400).send({message:"Access denied.No token provided"})
  }
  try{
    const decoded=jwt.verify(token,'My_secret')
    req.user=decoded 
    next()

  }catch(error){
    return res.status(400).json({message:"Invalid token"})
  }
}

module.exports=authMiddleware