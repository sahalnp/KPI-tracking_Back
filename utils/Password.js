import bcrypt from "bcrypt";
const hashPassword = async (pin) => {
    return await bcrypt.hash(pin, 10);
};
const comparePassword = async (pin, hashedPin) => {  
    return await bcrypt.compare(pin, hashedPin);
};
export { hashPassword, comparePassword };