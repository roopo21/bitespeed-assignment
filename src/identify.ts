import { Request, Response } from 'express';
import { PrismaClient, Contact } from './generated/prisma';

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

    if (contacts.length == 0) {
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
        return;
    }

    const primaryContacts = contacts.filter((contact: Contact) => contact.linkPrecedence === 'primary');
    if(primaryContacts.length > 0) {

    }
    const truePrimary = (primaryContacts.length > 0
        ? primaryContacts
        : contacts
    ).reduce((oldest: Contact, c: Contact) =>
        new Date(c.createdAt) < new Date(oldest.createdAt) ? c : oldest
    );


    const otherPrimaries = primaryContacts.filter(c => c.id !== truePrimary.id);

    // Demote other primaries to secondary
    for (const contact of otherPrimaries) {
        await prisma.contact.update({
            where: { id: contact.id },
            data: {
                linkPrecedence: "secondary",
                linkedId: truePrimary.id,
                updatedAt: new Date(),
            },
        });
    }

    const relatedContacts = await prisma.contact.findMany({
        where: {
            OR: [
                { id: truePrimary.id },
                { linkedId: truePrimary.id },
            ],
        },
        orderBy: { createdAt: "asc" },
    });

    const alreadyExists = relatedContacts.some(
        (c: Contact) => c.email === email && c.phoneNumber === phoneNumber
    );
    if (!alreadyExists && (email || phoneNumber)) {
        const newSecondary = await prisma.contact.create({
            data: {
                email,
                phoneNumber,
                linkedId: truePrimary.id,
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
            primaryContatctId: truePrimary.id,
            emails: [truePrimary.email, ...emails.filter(e => e !== truePrimary.email)],
            phoneNumbers: [truePrimary.phoneNumber, ...phones.filter(p => p !== truePrimary.phoneNumber)],
            secondaryContactIds: secondaryIds
        }
    });
}