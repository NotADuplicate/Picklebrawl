export class NameGenerator{
    static probsOb = {}
    static markovOb = {}
    static seedsLengths = [];
    static seedsAr = [];
    static minWordLength = 0;
    static maxWordLength = 30;
    static startingWords = [];

    static slurs = [
        "nigga", "negro", "kike", "cunt", ""
    ]
        
    static settings={mustCreateOnlyNewNames:false,mustKeepSmapleLength:true}
    //call this function let the generator find out the rules from the learning sample (which is array of strings)
    static init(ar){
        this.startingWords = ar;
        this.seedsLengths = [];
        //console.log("Init Array: ", ar)
        this.seedsAr = ar.slice();

        this.probsOb = {};
        for (var i = 0; i < this.seedsAr.length; i++ ){
            var str = this.seedsAr[i];
            var prevPrevCh ="|";
            var prevCh ="|";

            var len = str.length;
            for (var j = 0; j <= len; j++ ){
                if(j<len){
                    var ch = str.charAt(j);
                }else{
                    ch ="|";
                }

                if (prevPrevCh in this.probsOb){
                    var ob = this.probsOb[prevPrevCh];
                }else{
                    ob = {};
                    this.probsOb[prevPrevCh] = ob;
                }
                if (prevCh in ob){
                    var ob2 = ob[prevCh];
                }else{
                    ob2 = {};
                    ob[prevCh] = ob2;
                }
                if (ch in ob2){
                    ob2[ch]++;
                }else{
                    ob2[ch] = 1;
                }
                
                prevPrevCh = prevCh;
                prevCh = ch;
            }
            
            while (len>=this.seedsLengths.length){
                this.seedsLengths.push(0);
            }
            this.seedsLengths[len]++;
        }
        
        this.markovOb = {};
        for (var ch1 in this.probsOb){
            ob2 = this.probsOb[ch1];
            for (var ch2 in ob2){
                var ob3 = ob2[ch2];
                var charsAr = [];
                var weightAr = [];
                for (var ch3 in ob3){
                    charsAr.push(ch3);
                    weightAr.push(ob3[ch3]);
                }
                this.markovOb[ch1 + ch2] = {charsAr:charsAr, weightAr:weightAr};
            }
        }
        
        //defining the lengths of 95% smaple strings
        var percVal = 0.025;
        var percNum = Math.round(percVal * this.seedsAr.length);
        var id = 0;
        var sum = 0;
        while(sum<percNum){
            sum += this.seedsLengths[id];
            id++;
        }	
        this.minWordLength = id - 1;			
        
        id = this.seedsLengths.length-1;
        sum = 0;
        while(sum<percNum){
            sum += this.seedsLengths[id];
            id--;
        }
        this.maxWordLength = id + 1;
        
    }
    //call this function to generate a name
    static generate(){
        var numAttempts = 0;
        var mustMakeNextAttempt = true;
        while (mustMakeNextAttempt){
            mustMakeNextAttempt = false;
            numAttempts++;
            
            var res ="";
            var prevPrevCh ="|";
            var prevCh ="|";
            var need1More = true;
            while (need1More){
                var ob = this.markovOb[prevPrevCh + prevCh];
                var id = this.getRandomIndexFromWeightedAr(ob.weightAr);
                var ch = ob.charsAr[id];
                if (ch!="|"){
                    res += ch;
                }else{
                    need1More = false;
                }
                prevPrevCh = prevCh;
                prevCh = ch;				
                //if (res.length>30){
                //	break;
                //}
            }			
            
            if (numAttempts<10){
                if (this.settings.mustCreateOnlyNewNames){
                    if (this.seedsAr.indexOf(res)!=-1){
                        mustMakeNextAttempt = true;
                    }					
                }
                
                if (!mustMakeNextAttempt){
                    if (this.settings.mustKeepSmapleLength){
                        if ((res.length < this.minWordLength) || (res.length > this.maxWordLength)){
                            mustMakeNextAttempt = true;
                        }
                    }
                }
            }
        }
        return res;
    }
    //service function for weighted random generation
    static getRandomIndexFromWeightedAr(ar){
        if (ar.length == 1){
            if (ar[0]==0){
                return -1
            }else{
                return 0;
            }
        }
        var res = -1;
        var s = 0;
        for (var i = 0; i < ar.length; i++)
        {
            s += ar[i];
        }
        if (s > 0)
        {
            var rnd = s * Math.random();
            var rid = 0;
            while (rnd >= ar[rid])
            {
                rnd -= ar[rid];
                rid++;
            }
            res = rid;
        }
        else
        {
            res = -1;
        }
        return res;			
    }

    static zacNameGeneration() {
        const sample = arr => arr[Math.floor(Math.random() * arr.length)];
        let name = [];
        if (Math.floor(Math.random() * 3) !== 1) {
            if (name.length === 0) {
                if (Math.floor(Math.random() * 2) === 1) {
                    name.push(sample([
                        'W', 'W', 'R', 'R', 'R', 'T', 'T', 'Y', 'P', 'P', 'P', 'P', 'S', 'S', 'S', 'D',
                        'D', 'D', 'D', 'D', 'F', 'F', 'G', 'G', 'H', 'J', 'J', 'J', 'J', 'J', 'K', 'L',
                        'L', 'Z', 'Z', 'X', 'C', 'V', 'B', 'B', 'B', 'B', 'N', 'N', 'M', 'M', 'M', 'M', 'Qu']));
                } else {
                    name.push(sample('WTPPPPSDFFGGKZZCCCVBBBB'));
                    if (['W', 'Z'].includes(name[0])) {
                        name.push(sample('rh'));
                    } else if (['T', 'P', 'C', 'B'].includes(name[0])) {
                        name.push(sample('rhl'));
                    } else {
                        name.push(sample('rrl'));
                    }
                }
            }
        }
        if (name.length === 0) {
            name.push(sample([
                'A', 'A', 'A', 'A', 'A', 'E', 'E', 'E', 'I', 'I', 'I', 'O', 'O', 'O',
                'U', 'U', 'U', 'Y', 'Ea', 'Ea', 'Ou', 'Io', 'S', 'S', 'S', 'Oi', 'Au'
            ]));
        } else {
            name.push(sample([
                'a', 'a', 'a', 'a', 'a', 'e', 'e', 'e', 'i', 'i', 'i', 'o', 'o', 'o',
                'u', 'u', 'u', 'y', 'ea', 'ea', 'ou', 'io', 'oe'
            ]));
        }
        for (let i = 0; i < sample("000011111112223"); i++) {
            name.push(sample("wrrrtttppppssdddddggfhjjjkllzcvbbbbnnmmm"));
            name.push(sample([
                'a', 'a', 'a', 'a', 'a', 'e', 'e', 'e', 'i', 'i', 'i', 'o',
                'o', 'o', 'u', 'u', 'u', 'y', 'ea', 'ea', 'ou', 'io', 'oe'
            ]));
        }
        name = name.join('') + sample("wrrtttyppsdddfghhkllzxcvbbnnnnmmmm");
        return(name);
    }
}