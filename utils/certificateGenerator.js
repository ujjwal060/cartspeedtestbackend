import nodeHtmlToImage from "node-html-to-image";
import { uploadFile } from "./awsS3api.js";
import fs from "fs";
import path from "path";

const generateCertificateImage = async (certificateData) => {
    try {
        const { certificateName, locationName, email, certificateNumber, issueDate } = certificateData;
        const certificateBgPath = path.join(
            process.cwd(),
            "usersManagement/images/certificate.png"
        );
        const iconImagePath = path.join(
            process.cwd(),
            "usersManagement/images/icon-waltion.png"
        );

        const certificateBg = fs.readFileSync(certificateBgPath, {
            encoding: "base64",
        });
        const iconImage = fs.readFileSync(iconImagePath, { encoding: "base64" });

        const htmlContent = `
            <html>
            <head>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        width: 882px;
                        height: 600px;
                        font-family: 'Times New Roman', serif;
                        text-align: center;
                        background-image: url('data:image/png;base64,${certificateBg}');
                        background-size: 882px 600px;
                        background-repeat: no-repeat;
                        position: relative;
                        overflow: hidden;
                    }
                    .container {
                        width: 100%;
                        height: 100%;
                        padding: 80px 60px;
                        box-sizing: border-box;
                    }
                    .certificate-title {
                        color: #b69147;
                        font-weight: bold;
                        line-height:45px;
                        font-size: 40px;
                        margin-top: 10px;  /* Reduced top margin */
                        margin-bottom: 20px;
                    }
                    .certificate-subtitle {
                        font-weight: bold;
                        font-family: monospace;
                        text-transform: uppercase;
                        color: #39393b;
                        font-size: 24px;
                        margin: 20px 0;
                    }
                    .certificate-name {
                        position: relative;
                        font-size: 32px;
                        font-weight: bold;
                        margin: 20px 0 40px 0;
                    }
                    .certificate-name::after {
                        position: absolute;
                        border-bottom: 2px solid #b69147;
                        content: "";
                        width: 60%;
                        left: 50%;
                        top: 110%;
                        transform: translateX(-50%);
                    }
                    .certificate-desc {
                        font-weight: bold;
                        font-family: "Roboto", sans-serif;
                        text-transform: uppercase;
                        color: #39393b;
                        margin: 10px 0;
                        font-size: 18px;
                    }
                    .footer-container {
                        // position: absolute;
                        // bottom: 30px;
                        // left: 60px;
                        // right: 60px;
                        padding-top:20px;
                        display: flex;
                        justify-content: center;
                        gap:30px;
                        align-items: center;
                    }
                    .footer-left {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .footer-right {
                        text-align: center;
                        width:20%;
                         font-family: monospace;
                        font-weight: bold;
                        text-transform: uppercase;
                        color: #39393b;
                        font-size: 16px;
                    }
                    .footer-info {
                        text-align: left;
                        font-family: monospace;
                        font-weight: bold;
                        text-transform: uppercase;
                        color: #39393b;
                        font-size: 16px;
                        // width:70%;
                    }
                    .icon-image {
                        width: 120px;
                        height: 120px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="certificate-title">CERTIFICATE OF COMPLETION</h1>
                    <p class="certificate-subtitle">Proudly Presented to</p>
                    <div class="certificate-name">${certificateName}</div>
                    
                    <p class="certificate-desc">For Completing The Cartie App Safety and Rules For Walton County, FL</p>
                    <p class="certificate-desc">This Certificate Is Good For One Year From Completion, exclusively in</p>
                    <p class="certificate-desc">Walton County, ${locationName}</p>

                    <div class="footer-container">
                            <div class="footer-right">
                                <div>Presented By:</div>
                                <div>Cartie App</div>

                            </div>
                            <img src="data:image/png;base64,${iconImage}" class="icon-image" alt="Icon">
                            <div class="footer-left">
                                <div class="footer-info">
                                    <div>Certificate:${certificateNumber}</div>
                                    <div>Email:${email}</div>
                                </div>
                            </div>
                        </div>
                </div>
            </body>
            </html>
        `;

        const imageBuffer = await nodeHtmlToImage({
            html: htmlContent,
            type: "png",
            encoding: "binary",
            puppeteerArgs: {
                args: ["--no-sandbox"],
                defaultViewport: {
                    width: 800,
                    height: 600,
                    deviceScaleFactor: 1,
                },
            },
            transparent: true,
        });

        const s3Key = `certificates/${certificateNumber}.png`;
        const s3Url = await uploadFile(imageBuffer, s3Key, "image/png");

        return s3Url;
    } catch (error) {
        console.error("Error generating certificate image:", error);
        throw new Error("Failed to generate certificate image.");
    }
};


export { generateCertificateImage };
