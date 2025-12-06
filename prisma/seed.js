#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    try {
        // Create default admin user
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        
        const admin = await prisma.admin.upsert({
            where: { email: 'admin@qareebeen.com' },
            update: {},
            create: {
                email: 'admin@qareebeen.com',
                password: hashedPassword,
                name: 'مدير النظام'
            }
        });

        console.log('✓ Admin user created/updated:', admin.email);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
