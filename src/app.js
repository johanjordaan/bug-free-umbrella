const qr = require('qrcode');
const uuid = require('uuid');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const PSP_PER_MM = 2.8346456693;
const mm2psp = (mm) => {
    return mm*PSP_PER_MM;
}
const psp2mm = (psp) => {
    return psp/PSP_PER_MM;
}

//c8 - 161.57 x 229.61 -- CC
// 91 x 55 mm - Business cards
//257.9527559063 155.9055118115
//console.log(mm2psp(91),mm2psp(55))


// Generate the uuid
//
const id =  '3fef46d5-7645-4a6d-80e8-b05bb43c7ecc' //uuid.v4();

const cb = () => {
    const id = uuid.v4();
    qr.toFile(`./${id}.png`,id,{},(err,code)=>{
        cb()
    })
}


const cross = (doc, x,y) => {
    doc
        .moveTo(x-5, y)
        .lineTo(x+5, y)
        .moveTo(x, y-5)
        .lineTo(x, y+5)
        .stroke();
}

const createCard = (doc,id,w,h,xOffset,yOffset) => {
    const qrSize = mm2psp(40)

    doc
        .image(`${id}.png`,mm2psp(15)+xOffset,mm2psp(13)+yOffset,{
            fit:[qrSize,qrSize],
        });

    doc
        .image(`1337codersLogoUpDown.png`,0+xOffset,0+yOffset, {
            height: h,
        })

    doc
        .image(`MathJumpIcons.png`,mm2psp(60)+xOffset,mm2psp(20)+yOffset, {
            width: mm2psp(20),
        })

    doc
        .fontSize(8)
        .text(`${id}`,mm2psp(19)+xOffset,mm2psp(62-10)+yOffset,{
            height:mm2psp(5),
            width:mm2psp(80),
        });

    doc
        .moveTo(mm2psp(19)+xOffset, mm2psp(10)+yOffset)
        .lineTo(mm2psp(90)+xOffset, mm2psp(10)+yOffset)
        .stroke();

    cross(doc,xOffset,yOffset);
    cross(doc,xOffset+w,yOffset+h);
    cross(doc,xOffset,yOffset+h);
    cross(doc,xOffset+w,yOffset);
}


// Generate the qr code and save it
//
qr.toFile(`./${id}.png`,id,{},(err,code)=>{
    const w = mm2psp(91);
    const h = mm2psp(55);
    const xOffset = mm2psp(10);
    const yOffset = mm2psp(10);

    if(err) return console.log("error occurred")

    //
    const doc = new PDFDocument({size: 'A4', layout:'landscape'});
    doc.pipe(fs.createWriteStream(`${id}.pdf`));


    createCard(
        doc,
        id,
        w,h,
        xOffset,
        yOffset
    );

    createCard(
        doc,
        id,
        w,h,
        xOffset*2+w*1,
        yOffset
    );

    createCard(
        doc,
        id,
        w,h,
        xOffset,
        yOffset*2+h*1
    );

    createCard(
        doc,
        id,
        w,h,
        xOffset,
        yOffset*3+h*2
    );




    doc.end();
})

