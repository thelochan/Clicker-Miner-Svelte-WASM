<main>
    <title>Chip Clicker</title>

<body>
    <div class = "sectionMain">
        <center>
        <div class = "scoreContainer unselectable">
    <span id="score">0</span> Chips <br>

    <br> 
    <div class = "clickerContainer unselectable"> <img src="./images/chip.png" alt= "CPU" height="256px" width="256px" onClick="addToScore(1)">
    </div>
    </center>
</div>


<div class = "sectionSide">
    <table class = "upgradeButton" onClick= "buyUpgrade()">
        <tr> <td id="nameAndCost"> <p>UPGRADES</p> </td></tr>
         <tr> <td id="nameAndCost"> <p>Look up</p></td>  </tr>
        <tr> <td id="nameAndCost"> <p>Web RTC</p></td> </tr>
        <tr> <td id="nameAndCost"> <p>Blah</p></td>    </tr>
        <tr> <td id="nameAndCost"> <p>Blah 2 </p></td>  </tr>
        <tr> <td id="nameAndCost"> <p>Dark Blah Returns</p></td>  </tr>
        <tr> <td id="nameAndCost"> <p>GPU Stats</p></td> </tr>
            
        

    </table>
</div>  

    <script>
        var score = 0;
        var upgradeCost = 10;
        var upgrades = 0;

        function buyUpgrade() {
            if (score >= upgradeCost){
                score = score - upgradeCost;
                upgrades = upgrades+1;
                upgradeCost = Math.round(upgradeCost * 1.5);

                document.getElementById("score").innerHTML = score;
                document.getElementById("upgradeCost").innerHTML = upgradeCost;
                document.getElementById("upgrades").innerHTML = upgrades;
            }
        }

        function addToScore(amount) {
            score = score + amount;
            document.getElementById("score").innerHTML = score;
        }

   

    </script>
</main>

<style>
	 .sectionMain {
            float: left;
            width: 80%;
        }

        .sectionSide {
            float: right;
            width: 10%;

        }

        .scoreContainer {
            background-color: rgb(238, 238, 238, 0.6);
            width: 50%;
            padding: 10px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;


        }

        .clickerContainer img {
            position: relative;
            transition: all .2s ease-in-out;
            
        }

        .clickerContainer img:hover { transform: scale(1.15);}
        .clickerContainer img:active { transform: scale(0.9); }

  /*   .shopButton {
            background-color: #b5b5b5;
            transition: all 0.2s ease-in-out;
            border-radius: 10px;
            width: 100%;
            margin: 10px 0px 10px 0px;
        }

        .shopButton :hover {
            background-color: #c7c7c7;
            transition: all .2s ease-in-out;
        } */

        .shopButton #nameAndCost p {
            margin: 0px;
            width: 60%;
        }

        .unselectable {
            user-select: none;
        }

</style>