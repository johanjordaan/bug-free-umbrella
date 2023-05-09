const qr = require('qrcode');
const uuid = require('uuid');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const rnd = require('lcg-rnd');
const md5 = require("md5");

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

const colors = [
    "White",
    "Yellow",
    "Blue",
    "Red",
    "Green",
    "Black",
    "Brown",
    "Azure",
    "Ivory",
    "Teal",
    "Silver",
    "Purple",
    "Navy_Blue",
    "Pea_Green",
    "Gray",
    "Orange",
    "Maroon",
    "Charcoal",
    "Aquamarine",
    "Coral",
    "Fuchsia",
    "Wheat",
    "Lime",
    "Crimson",
    "Khaki",
    "Pink",
    "Magenta",
    "Olden",
    "Plum",
    "Olive",
    "Cyan",
    "Gold"
];

const numbers = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten"
]

const create_password = (length) => {
    let acc = []
    for(let i =0;i<length;i++) {
       acc.push(`${rnd.rndIntBetween(0,9)}`)
    }
    return acc.join('')
}

const create_username = () => {
    const a = colors[rnd.rndIntBetween(0,colors.length-1)];
    const b = numbers[rnd.rndIntBetween(0,numbers.length-1)];
    if(rnd.random()>0.5) {
        return `${a}_${b}`.toLowerCase()
    } else {
        return `${b}_${a}`.toLowerCase()
    }
}

const create_users = (seed, dest, run_id, run_length, initial_users) => {
    let path = `${dest}/${run_id}`

    if(fs.existsSync(path)) {
        console.log("Exists, skipping")
    }

    fs.mkdirSync(path, { recursive: true })

    rnd.srand(seed)

    let users = initial_users
    for(let i=users.length;i<run_length;i++) {
        users.push({
            id:uuid.v4(),
            username:create_username(),
            password:create_password(6),
            salt:create_password(20),
        })
    }
    let data = JSON.stringify({'run_id':run_id,'run_name':create_username(),'users':users},null,2);
    fs.writeFileSync(`${path}/${run_id}.json`, data);
}

const create_sql = (dest, run_id) => {
    let path = `${dest}/${run_id}`
    const run = JSON.parse(fs.readFileSync(`${path}/${run_id}.json`));

    sql = ''

    sql += `INSERT INTO tables.groups(id, name, dt) VALUES ('${run.run_id}','${run.run_name}',now());\n`;

    run.users.forEach(user=>{
        password = md5(user.password+user.salt)
        sql += `INSERT INTO tables.users(id,name,group_id,username,password,salt,avatar_index,dt) VALUES ('${user.id}','','${run_id}','${user.username}','${password}','${user.salt}',0,now());\n`;
    })

    fs.writeFileSync(`${path}/${run_id}.sql`, sql);
}


const create_qrcodes = async (dest, run_id) => {
    let path = `${dest}/${run_id}`
    const run = JSON.parse(fs.readFileSync(`${path}/${run_id}.json`));

    let idx = 0
    let done = false
    const cb = () => {
        const id = run.users[idx]['id']
        qr.toFile(`${path}/${id}.png`,id,{},(err,code)=>{
            idx++;
            if(idx<run.users.length) {
                cb()
            } else {
                done = true
            }
        })
    }
    cb()
    while(!done) {
        await new Promise(resolve => setTimeout(resolve, 2000));
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

const createCard = (path,doc,user,w,h,xOffset,yOffset) => {
    const qrSize = mm2psp(40)


    // Left Branding
    //
    doc
        .image(`1337codersLogoUpDown.png`,0+xOffset,0+yOffset, {
            height: h,
        })

    // Product Branding
    //
    doc
        .image(`MathJumpIcons.png`,mm2psp(75)+xOffset,mm2psp(3)+yOffset, {
            width: mm2psp(15),
        })

    // QR Code and id
    doc
        .image(`${path}/${user.id}.png`,mm2psp(15)+xOffset,mm2psp(13)+yOffset,{
            fit:[qrSize,qrSize],
        });

    doc
        .fontSize(8)
        .text(`${user.id}`,mm2psp(19)+xOffset,mm2psp(62-10)+yOffset,{
            height:mm2psp(5),
            width:mm2psp(80),
        });

    // Line for name
    //
    doc
        .fontSize(7)
        .text(`This key belongs to :`,mm2psp(20)+xOffset,mm2psp(1)+yOffset,{
            height:mm2psp(5),
            width:mm2psp(80),
        });

    doc
        .moveTo(mm2psp(19)+xOffset, mm2psp(14)+yOffset)
        .lineTo(mm2psp(70)+xOffset, mm2psp(14)+yOffset)
        .stroke();



    // User Name
    //
    doc
        .fontSize(7)
        .text(`USERNAME :`,mm2psp(60)+xOffset,mm2psp(25)+yOffset,{
            height:mm2psp(5),
            width:mm2psp(80),
        });

    doc
        .fontSize(10)
        .text(`${user.username}`,mm2psp(60)+xOffset,mm2psp(28)+yOffset,{
            height:mm2psp(5),
            width:mm2psp(80),
        });


    // Password
    //
    doc
        .fontSize(7)
        .text(`PASSWORD :`,mm2psp(60)+xOffset,mm2psp(35)+yOffset,{
            height:mm2psp(5),
            width:mm2psp(80),
        });

    doc
        .fontSize(10)
        .text(`${user.password}`,mm2psp(60)+xOffset,mm2psp(38)+yOffset,{
            height:mm2psp(5),
            width:mm2psp(80),
        });



    cross(doc,xOffset,yOffset);
    cross(doc,xOffset+w,yOffset+h);
    cross(doc,xOffset,yOffset+h);
    cross(doc,xOffset+w,yOffset);
}

const create_pdf = (dest, run_id) => {
    let path = `${dest}/${run_id}`

    const w = mm2psp(91);
    const h = mm2psp(55);
    const xOffset = mm2psp(10);
    const yOffset = mm2psp(10);

    const doc = new PDFDocument({size: 'A4'})//, layout:'landscape'});
    doc.pipe(fs.createWriteStream(`${path}/${run_id}.pdf`));

    let x=0
    let y=0
    const run = JSON.parse(fs.readFileSync(`${path}/${run_id}.json`));
    run.users.forEach((user)=>{
        filename = `../data/${run_id}/${user.id}.png`
        if(fs.existsSync(filename)) {
            console.log(filename)
            createCard(
                path,
                doc,
                user,
                w,h,
                xOffset*(x+1)+(w*x),
                yOffset*(y+1)+(h*y),
            );
            x = x + 1
            if(x === 2) {
                x = 0
                y = y + 1
            }
            if(y === 4) {
                x = 0
                y = 0
                doc.addPage()
            }

        }
    })

    doc.end();
}

const run = async (seed, run_length, run_id, initial_users, generate_pdf_only) => {
    if(generate_pdf_only) {
    } else {
        create_users(seed,'../data',run_id, run_length,initial_users)
        create_sql('../data',run_id)
        await create_qrcodes('../data', run_id)
    }
    create_pdf('../data', run_id)
}


//////////////////////////////////////////////////////////////////////////////////////////

const run_length = 8
const run_id = 'fbe9d95d-72a5-48a6-95b6-86fe4fdf39e6' || uuid.v4()
const initial_users = [
    {
        'id':'3fef46d5-7645-4a6d-80e8-b05bb43c7ecc',
        'username':'johan',
        'password':'johan',
        'salt':'johan'

    }
] || []
seed = 123
run(seed, run_length, run_id, initial_users, false)
