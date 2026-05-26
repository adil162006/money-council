import type {Request,Response} from 'express';
import {UserModel} from "../models/user.model";
import AsyncHandler from '../lib/AsyncHandler';
import { generateToken,verifyToken } from '../lib/jwt';
import  {hashPassword,comparePassword} from '../lib/hash';
import { json } from 'node:stream/consumers';



export const registerUser = AsyncHandler(async(req:Request,res:Response)=>{
const {name,email,password} = req.body;

if(!name || !email || !password){
    return res.status(400).json({
        message:"all fields are required"
    })
}

//check existing user

const existingUser = await UserModel.findOne({email})
const hashedPassword = await hashPassword(password);
if(existingUser) {
    return res.status(400).json({
        message:"User with that email already exists"
    })
}

const user = await UserModel.create({
    name,
    email,
    password:hashedPassword,
})

const token = generateToken({
    id:user._id
})

res.cookie("token",token,{
    httpOnly:true,
    maxAge:7 *24 *60 *60*1000
})

 return res.status(201).json({
        message:
          "User registered successfully",
        user,
      });

})

export const loginUser = AsyncHandler(async(req:Request,res:Response)=>{
const {email,password} = req.body
if(!email || !!password){
    return res.status(400).json({
        message:"All fields are required"
    })
}

const user = await UserModel.findOne({email})

if(!user){
    return res.status(400).json({
        message:"Invalid Credentials"
    })
}
const isCorrectPassword = await comparePassword(password,user.password)
    if (!isCorrectPassword) {
        return res.status(400).json({
          message:
            "Invalid credentials",
        });
      }
      const token = generateToken({
        id:user._id
      })

    res.cookie(
        "token",
        token,
        {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          maxAge:
            7 *
            24 *
            60 *
            60 *
            1000,
        }
      );
      return res.status(200).json({
        message:
          "Login successful",
        user,
      });

})


export const logoutUser = AsyncHandler(
  async (req: Request, res: Response) => {
    res.cookie("token", "", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      expires: new Date(0),
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  }
);