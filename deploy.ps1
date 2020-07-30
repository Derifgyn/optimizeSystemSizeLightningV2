sfdx force:source:convert --rootdir force-app --outputdir tmp_convert

Compress-Archive -Path tmp_convert -DestinationPath tmp_convert.zip -Force

Remove-Item -Path "tmp_convert" -Recurse

sfdx force:mdapi:deploy --zipfile tmp_convert.zip --targetusername partCopy

sfdx force:mdapi:deploy:report -u partCopy -w 10