import bcrypt from "bcryptjs";


const SALT_ROUND = 10;


export async function hashPassword(password:string){
    return await bcrypt.hash(password,SALT_ROUND)
}

export async function comparePassword(password:string,hashPassword:string){
    return await bcrypt.compare(password,hashPassword)
}