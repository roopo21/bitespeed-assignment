import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { error } from 'console';


export default async function identify(req: Request, res: Response, prisma: PrismaClient) {
    const { email, phoneNumber } = req.body;


    if (!email && !phoneNumber) {
        res.status(400).json({ error: "At least either of Email / Phone Number has to be present." });
        return;
    }

    const contacts = await prisma.contact.findMany({
        where: {
            OR: [
                email ? { email } : undefined,
                phoneNumber ? { phoneNumber } : undefined,
            ].filter(Boolean) as any,
        },
        orderBy: { createdAt: 'asc' }
    });

    const primaryContact = contacts.find((contact: { linkPrecedence: string; }) => contact.linkPrecedence === 'primary') || contacts[0]; // add types.
    if (!primaryContact) {
        // no primary -> create new primary contact
        const newContact = await prisma.contact.create({
            data: {
                email, phoneNumber, linkPrecedence: 'primary',
            }
        });
        res.status(200).json({
            contact: {
                primaryContactId: newContact.id,
                emails: [newContact.email].filter(Boolean),
                phoneNumbers: [newContact.phoneNumber].filter(Boolean),
                secondaryContactIds: []
            }
        });
    }

    const relatedContacts = await prisma.contact.findMany({
        

    })
}