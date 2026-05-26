import app from "./src/server"
import { connectDb } from "./src/config/db"

const port = process.env.PORT!

async function startServer(): Promise<void> {
    await connectDb()

    app.listen(port,()=>{
        console.log(`Server running on port : ${port}`);
        
    })

}
startServer()