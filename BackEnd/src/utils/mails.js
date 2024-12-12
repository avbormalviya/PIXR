
import { client, sender } from "../services/mailtrap.config.js";

export const sendVerificationEmail = async (email, userName, verificationCode) => {
	const recipient = [{ email }];

	try {
		const response = await client.send({
			from: sender,
			to: recipient,
			// subject: "Verify your email",
			template_uuid: "51c00089-d9b7-4f87-a202-763f98fa8423",
            template_variables: {
                "name": userName,
                "code": verificationCode,
                "company_info_name": "Test_Company_info_name",
                "company_info_address": "Test_Company_info_address",
                "company_info_city": "Test_Company_info_city",
                "company_info_zip_code": "Test_Company_info_zip_code",
                "company_info_country": "Test_Company_info_country"
            },
			// category: "Email Verification",
		});

		console.log("Email sent successfully", response);
	} catch (error) {
		console.error(`Error sending verification`, error);

		throw new Error(`Error sending verification email: ${error}`);
	}
};

// export const sendWelcomeEmail = async (email, name) => {
// 	const recipient = [{ email }];

// 	try {
// 		const response = await client.send({
// 			from: sender,
// 			to: recipient,
// 			template_uuid: "e65925d1-a9d1-4a40-ae7c-d92b37d593df",
// 			template_variables: {
// 				company_info_name: "Auth Company",
// 				name: name,
// 			},
// 		});

// 		console.log("Welcome email sent successfully", response);
// 	} catch (error) {
// 		console.error(`Error sending welcome email`, error);

// 		throw new Error(`Error sending welcome email: ${error}`);
// 	}
// };

// export const sendPasswordResetEmail = async (email, resetURL) => {
// 	const recipient = [{ email }];

// 	try {
// 		const response = await client.send({
// 			from: sender,
// 			to: recipient,
// 			subject: "Reset your password",
// 			html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
// 			category: "Password Reset",
// 		});
// 	} catch (error) {
// 		console.error(`Error sending password reset email`, error);

// 		throw new Error(`Error sending password reset email: ${error}`);
// 	}
// };

// export const sendResetSuccessEmail = async (email) => {
// 	const recipient = [{ email }];

// 	try {
// 		const response = await client.send({
// 			from: sender,
// 			to: recipient,
// 			subject: "Password Reset Successful",
// 			html: PASSWORD_RESET_SUCCESS_TEMPLATE,
// 			category: "Password Reset",
// 		});

// 		console.log("Password reset email sent successfully", response);
// 	} catch (error) {
// 		console.error(`Error sending password reset success email`, error);

// 		throw new Error(`Error sending password reset success email: ${error}`);
// 	}
// };