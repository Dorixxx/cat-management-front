import https from 'https';
import fs from 'fs';

const url = 'https://raw.githubusercontent.com/Dorixxx/cat-management/master/backend/app/schemas.py';
const file = fs.createWriteStream("schemas_temp.py");

https.get(url, function(response) {
   response.pipe(file);
   file.on('finish', () => {
       console.log('Schemas.py downloaded.');
   });
});
