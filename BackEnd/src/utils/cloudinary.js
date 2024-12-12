import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (file) => {
    try {
        if (!file) return

        const response = await cloudinary.uploader.upload(file, {
            resource_type: "auto",

            transformation: [
                {
                    quality: "auto",
                    fetch_format: "auto",
                    video_bitrate: "auto"
                }
            ]
        })

        fs.unlinkSync(file)
        
        return response

    } catch (error) {
        fs.unlinkSync(file)

        console.log(error)
        
        return
    }
}

export { uploadOnCloudinary };