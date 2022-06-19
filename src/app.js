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


const create_ids = (run_length, initial_ids) => {
    const ids = initial_ids
    for(let i=ids.length;i<run_length;i++) {
        ids.push(uuid.v4())
    }
    return ids
}

const create_qrcodes = async (run_id,ids) => {
    let id_idx = 0
    let path = `../data/${run_id}`
    fs.mkdirSync(path, { recursive: true })
    let done = false
    const cb = () => {
        const id = ids[id_idx]
        qr.toFile(`${path}/${id}.png`,id,{},(err,code)=>{
            id_idx++;
            if(id_idx<ids.length) {
                cb()
            } else {
                done = true
            }
        })
    }
    cb()
    while(!done) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        let data = JSON.stringify({'run_id':run_id,'ids':ids},null,2);
        fs.writeFileSync(`${path}/${run_id}.json`, data);
    }
}

const cross = (doc, x,y) => {
    doc
        .moveTo(x-5, y)
        .lineTo(x+5, y)
        .moveTo(x, y-5)
        .lineTo(x, y+5)
        .stroke();
}

const createCard = (path,doc,id,w,h,xOffset,yOffset) => {
    const qrSize = mm2psp(40)

    doc
        .image(`${path}/${id}.png`,mm2psp(15)+xOffset,mm2psp(13)+yOffset,{
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

const create_pdf = (run_id) => {
    let path = `../data/${run_id}`

    const w = mm2psp(91);
    const h = mm2psp(55);
    const xOffset = mm2psp(10);
    const yOffset = mm2psp(10);

    const doc = new PDFDocument({size: 'A4'})//, layout:'landscape'});
    doc.pipe(fs.createWriteStream(`${path}/${run_id}.pdf`));

    const filenames = fs.readdirSync(path);

    let x=0
    let y=0
    filenames.forEach((filename)=>{
        if(filename.endsWith('.png')) {
            const id = filename.replace(".png","")
            createCard(
                path,
                doc,
                id,
                w,h,
                xOffset*(x+1)+(w*x),
                yOffset*(y+1)+(h*y),
            );
            x = x + 1
            if(x == 2) {
                x = 0
                y = y + 1
            }
            if(y == 4) {
                x = 0
                y = 0
                doc.addPage()
            }
        }
    })

    doc.end();
}

const run = async (run_length, run_id, initial_ids, generate_pdf_only) => {
    if(generate_pdf_only) {
    } else {
        const ids = create_ids(run_length,initial_ids)
        await create_qrcodes(run_id, ids)
    }
    create_pdf(run_id)
}


//////////////////////////////////////////////////////////////////////////////////////////

const run_length = 20
const run_id = 'fbe9d95d-72a5-48a6-95b6-86fe4fdf39e6' || uuid.v4()
const initial_ids = [
    '3fef46d5-7645-4a6d-80e8-b05bb43c7ecc'
] || []
run(run_length, run_id, initial_ids, false)
