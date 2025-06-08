export const convertToCustomCsv = (items: any[]): string => {
  const headers: string[] = [
    'level',
    'regtime',
    'regSiteCode',
    'regLevel',
    'regSeq',
    'name',
    'gender',
    'year',
    'month',
    'day',
    'passcode',
    'nativeLanguage',
    'learningPlace',
    'examReason',
    'occupation',
    'occupationalDetails',
    'mediaContacts',
    'communication.teacher',
    'communication.friends',
    'communication.family',
    'communication.supervisor',
    'communication.colleagues',
    'communication.customers',
    'attempts1',
    'attempts2',
    'attempts3',
    'attempts4',
    'attempts5',
    'pass1',
    'pass2',
    'pass3',
    'pass4',
    'pass5'
  ];
   

  items.sort((a,b) => a.testLevel - b.testLevel);
  console.log(items)
  const rows = items.map((item) => {
    const row: Record<string, any> = {};
    headers.forEach(header => row[header] = ''); // Initialize all fields

    // Basic fields
    row.level = item.testLevel
    row.regtime = item.regtime || '24B'
    row.regSiteCode = item.regSiteCode || '3010201'
    row.regLevel = item.testLevel
    row.regSeq = item.regSeq

    row.name = ""

    if(item.firstName.length > 0){
        row.name += item.firstName.toUpperCase();
    }
    if(item.middleName.length > 0){
        row.name += ' ' + item.middleName.toUpperCase();
    }
    if(item.lastName.length > 0){
        row.name += ' ' + item.lastName.toUpperCase();
    }

    row.gender = 'N'
    if(item.gender == 'male' || item.gender == 'M'){
        row.gender = 'M'
    }else if(item.gender == 'female' || item.gender == 'F'){
        row.gender = 'F'
    }
    
    const dateString = item.dob;
    const date = new Date(dateString);

    const year = date.getFullYear(); // Gets 4-digit year (1999)
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so +1 (08)
    const day = String(date.getDate()).padStart(2, '0'); // Gets day with leading zero (07)
    //dob
    row.year = year
    row.month = month
    row.day = day

    row.passcode = item.passcode
    row.nativeLanguage = item.nativeLanguage
    row.learningPlace = item.learningPlace
    row.examReason = item.examReason
    row.occupation = item.occupation
    row.occupationalDetails = item.occupationalDetails || ' '

    let mediaStr = ''
    for(let i=1;i<=9;i++){
        if(item.mediaContacts.includes(i)){
            mediaStr += i
        }else{
            mediaStr += ' '
        }
    }
    row.mediaContacts = mediaStr

    const communicationKeys = ['teacher', 'friends', 'family', 'supervisor', 'colleagues', 'customers'];

    for (const key of communicationKeys) {
        const communication = item.communication[key];
        let result = '';

        // Check each skill and append the corresponding code
        result += communication.speaking ? '1' : ' ';
        result += communication.listening ? '2' : ' ';
        result += communication.reading   ? '3' : ' ';
        result += communication.writing   ? '4' : ' ';

        // Check if all skills are false, then append '5'
        const noSkills = !communication.speaking && 
                        !communication.listening && 
                        !communication.reading && 
                        !communication.writing;
        result += noSkills ? '5' : ' ';

        // Assign the result to the row object
        row[`communication.${key}`] = result;
    }

    let attempts = item.attempts;

    attempts.sort((a:any, b:any) => a.level - b.level);

    for(let i=1;i<=5;i++){
        let ans = attempts[i-1].attempts;
        if(ans == ''){
            ans = 0
        }
        
        row[`attempts${i}`] = ans
    }

    for(let i=1;i<=5;i++){
        if(attempts[i-1].result == 'pass' || attempts[i-1].result == 1){
            row[`pass${i}`] = '1'
        }else if(attempts[i-1].result == 'fail' || attempts[i-1].result == 2){
            row[`pass${i}`] = '2'
        }else{
            row[`pass${i}`] = ' '
        }
    }

    // Construct CSV row (no header)
    return headers.map(header => `"${String(row[header]).replace(/"/g, '""')}"`).join(',');
  });

  return rows.join('\n'); // No headers
};
