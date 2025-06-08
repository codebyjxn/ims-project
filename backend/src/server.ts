import express, { Request, Response } from 'express';
import config from '@/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression'; 
import helmet from 'helmet';
import type { CorsOptions } from 'cors';
import v1Routes from '@/routes/v1';
const app = express();
app.use(express.json());
app.use(cookieParser());

// enable response compression to reduce payload size and 
// improve performance 
app.use(compression({
  threshold: 1024, //only compress responses larger than 1kb
}),);
// use helmet to enhance security by setting various http headers
app.use(helmet());
app.use(express.urlencoded({extended: true}));
const corsOptions: CorsOptions = {
  origin(origin, callback){
    if (config.NODE_ENV == 'development' || !origin || config.WHITELIST_ORIGINS.includes(origin))
      callback(null, true);
    else {
      callback(new Error(`CORS Error: ${origin} is not allowed by CORS`), 
      false
    );
    console.log(`CORS Error: ${origin} is not allowed by CORS`)

    }
  }

}
// cors middleware 
app.use(cors(corsOptions));

(async () => {
  try {
    app.use('/api/v1', v1Routes);
    app.listen(config.PORT, () => {
      console.log(`Server running on http://localhost:${config.PORT}`);
    });

  }catch(err){
    console.log('failed to start the server');
    if (config.NODE_ENV == 'production'){
      process.exit(1);
    }
  }
})();
const handleServerShutdown = async () => {
try {
  console.log('Server SHUTDOWN');
  process.exit(0);
}catch(err){
  console.log('Error during server shutdown', err);
}
}

process.on('SIGTERM', handleServerShutdown);
process.on('SIGINT', handleServerShutdown);

export default app;


