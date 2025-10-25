#!/usr/bin/env node
/**
 *
 */

import readline from "readline";
import bcrypt from "bcrypt";
import { prisma } from "./index.js";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function createAdminUser() {
    console.log("🚀 Creating Admin User...");
    console.log("====================================");

    // 📝 Ask for input
    const name = await ask("Enter name: ");
    const mobile = await ask("Enter mobile number: ");
    const password = await ask("Enter password: ");
    const confirmPassword = await ask("Confirm password: ");

    if (!name || !mobile || !password) {
        console.log("❌ All fields are required");
        process.exit(1);
    }

    if (password !== confirmPassword) {
        console.log("❌ Passwords do not match");
        process.exit(1);
    }

    try {
        // ✅ Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: { mobile },
        });

        if (existingUser) {
            console.log("⚠️  User with this mobile already exists.");
            console.log(`User: ${existingUser.name}`);
            process.exit(1);
        }

        // 🔐 Hash password
        const saltRounds = 10;
        const pin_hash = await bcrypt.hash(password, saltRounds);

        // 📌 Prepare data
        const data = {
            name,
            mobile,
            uniqueId:`ADM${Date.now()}`,
            pin_hash,
            role: "Owner",
            active_flag: true,
          
        };

        // 🧾 Create admin
        const admin = await prisma.user.create({
            data,
        });

        console.log(
            "\n✅ Admin user crear your preferred unique ID generatorted successfully!"
        );
        console.log("====================================");
        console.log(`🧑 Name        : ${admin.name}`);
        console.log(`📱 Mobile      : ${admin.mobile}`);
        console.log(`🆔 Unique ID   : ${admin.uniqueId}`);
        console.log(`🔐 Password    : ${password}`);
        console.log(`👑 Role        : ADMIN`);
        console.log(`✅ Active      : ${admin.active_flag}`);
        console.log("====================================");

        rl.close();
        process.exit(0);
    } catch (err) {
        console.error("❌ Error creating admin user:", err);
        rl.close();
        process.exit(1);
    }
}

createAdminUser();
