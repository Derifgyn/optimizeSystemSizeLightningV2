const { exec } = require('shelljs');


async function main () {

    try {
        exec('sfdx force:source:convert --rootdir force-app --outputdir tmp_convert');
        console.log('converted');
        console.log('-----------');

        exec('rm tmp_convert.zip');
        console.log('removed old zip');
        console.log('-----------');

        exec('zip -r tmp_convert.zip tmp_convert');
        console.log('zipped');
        console.log('-----------');

        exec('sfdx force:mdapi:deploy --zipfile tmp_convert.zip --targetusername partCopy');
        console.log('begun deployment');
        console.log('-----------');

        exec('sfdx force:mdapi:deploy:report -u partCopy -w 10');
        console.log('finished deployment');
        console.log('-----------');

    } catch (e) {
        console.log('error:', e);
    }
};
main();