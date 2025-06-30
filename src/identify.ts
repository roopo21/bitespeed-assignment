import { Request, Response } from 'express';
import { PrismaClient, Contact } from './generated/prisma';
import {IdentifyResponse } from './types';


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

    const primaryContact = contacts.find((contact: Contact) => contact.linkPrecedence === 'primary') || contacts[0];
    if (!primaryContact) {
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
        where: {
            OR: [
                { linkedId: primaryContact.id },
                { id: primaryContact.id },
            ]
        },
        orderBy: { createdAt: 'asc' }
    });

    const alreadyExists = relatedContacts.some(
        (c: Contact) => c.email === email && c.phoneNumber === phoneNumber
    );
    if (!alreadyExists && (email || phoneNumber)) {
        const newSecondary = await prisma.contact.create({
            data: {
                email,
                phoneNumber,
                linkedId: primaryContact.id,
                linkPrecedence: 'secondary'
            }
        });

        relatedContacts.push(newSecondary);
    }
    const emails = Array.from(
        new Set(relatedContacts.map((c: Contact) => c.email).filter(Boolean))
    );
    const phones = Array.from(new Set(relatedContacts.map((c: Contact) => c.phoneNumber).filter(Boolean)));

    const secondaryIds = relatedContacts
        .filter((c: Contact) => c.linkPrecedence === 'secondary')
        .map((c: Contact) => c.id);

    res.status(200).json({
        contact: {
            primaryContatctId: primaryContact.id,
            emails: [primaryContact.email, ...emails.filter(e => e !== primaryContact.email)],
            phoneNumbers: [primaryContact.phoneNumber, ...phones.filter(p => p !== primaryContact.phoneNumber)],
            secondaryContactIds: secondaryIds
        }
    });
}