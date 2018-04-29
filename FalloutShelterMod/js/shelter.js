var key = [2815074099, 1725469378, 4039046167, 874293617, 3063605751, 3133984764, 4097598161, 3620741625];
var iv = sjcl.codec.hex.toBits("7475383967656A693334307438397532");
sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();
var isLoaded=false;

function colorHack()
{
  $('.jscolor').each(function() {
    $(this).focus();
  });

  $("input").blur();
}

function colorConverter(colorhex, mode)
{
  var mode = ((mode === undefined) ? false : mode);
  if(mode)
  {

    var hexColor = colorhex.toString(16).substring(2).toUpperCase();
    return hexColor;
  }
  else
  {
    var colorfos;
    var x = colorhex.substring(0, 0) + "FF" + colorhex.substring(0);
    colorfos = parseInt(x, 16);
    return colorfos;
  }
}

//lazy code addition, but I believe it is beneficial and not too invasive.
function numberCheckHelper()
{
  $("input[type='number']").each(function()
  {
    if($(this).val === undefined || $(this).val().trim().length == 0 || $(this).val() == null)
    {
      var a = $(this).attr("min");
      if(a === undefined) a = 0;
      $(this).val(a);
    }
  });
  setTimeout(numberCheckHelper, 3000);
}

function colortofos()
{
    var colorhex = document.getElementsByClassName("jscolor")[0].value;
    $(".value1").html(colorConverter(colorhex));
}

$(document).ready(function(){


  numberCheckHelper();
  if(window.location.href.indexOf("?preset=") > -1 && window.location.href.indexOf("?savename=") > -1){

    urlPreset = window.location.href.substring(window.location.href.indexOf("?preset=")+8, window.location.href.indexOf("?savename="));
    urlSaveName = window.location.href.substring(window.location.href.indexOf("?savename=")+10);

    preset(urlPreset,urlSaveName);


  }
});

function handleFileSelect(evt) {

  try {
    evt.stopPropagation();
    evt.preventDefault();
    var f = evt.target.files[0];
    var fileName = f.name;
    if (f.size > 3e7) {
      throw "File exceeds maximum size of 30MB"
    }
    if (f) {
      var reader = new FileReader;
      if (evt.target.id == "sav_file") {
        reader.onload = function (evt2) {
          try {
            decrypt(evt2, fileName, reader.result)
          } catch (e) {
            alert("Error: " + e)
          }
        };
        reader.readAsText(f)
      } else if (evt.target.id == "json_file") {
        reader.onload = function (evt2) {
          try {
            encrypt(evt2, fileName, reader.result)
          } catch (e) {
            alert("Error: " + e)
          }
        };
        reader.readAsText(f)
      }
    }
  } catch (e) {
    alert("Error: " + e)
  } finally {
    evt.target.value = null
  }

}

function decrypt(evt, fileName, base64Str) {

  var cipherBits = sjcl.codec.base64.toBits(base64Str);
  var prp = new sjcl.cipher.aes(key);
  var plainBits = sjcl.mode.cbc.decrypt(prp, cipherBits, iv);
  var jsonStr = sjcl.codec.utf8String.fromBits(plainBits);
  try {
    document.getElementById("presetSaveName").value = fileName;
    edit(fileName, JSON.parse(jsonStr));
  } catch (e) {
    throw "Decrypted file does not contain valid JSON: " + e
  }

}

function encrypt(fileName, save) {

  var compactJsonStr = JSON.stringify(save);
  var plainBits = sjcl.codec.utf8String.toBits(compactJsonStr);
  var prp = new sjcl.cipher.aes(key);
  var cipherBits = sjcl.mode.cbc.encrypt(prp, plainBits, iv);
  var base64Str = sjcl.codec.base64.fromBits(cipherBits);
  var blob = new Blob([base64Str], {
    type: "text/plain"
  });


  saveAs(blob, fileName.replace(".txt", ".sav").replace(".json", ".sav"))


}

document.getElementById("sav_file").addEventListener("change", function (e) {

  $('.box').removeClass('hover').addClass('ready');
  $('.instructions').hide();


  handleFileSelect(e);

}, false);

document.ondragover = document.ondrop = function (e) {
  e.preventDefault();
  return false;
};

$('body .container .box')
  .on('dragover', function (e) {
    $('.box').addClass('hover');
    $('.instructions').hide();
  })
  .on('dragleave', function (e) {
    $('.box').removeClass('hover');
    $('.instructions').show();
  })
  .on('drop', function (e) {

    $('.box').removeClass('hover').addClass('ready');
    $('.instructions').hide();

    var file = e.originalEvent.dataTransfer.files[0],
      fileName = file.name,
      reader = new FileReader();

    reader.onload = function (ev) {
      try {
        decrypt(ev, fileName, reader.result);
      } catch (err) {
        alert("Error: " + err);
      }
    };

    reader.readAsText(file);

    e.preventDefault();
    return false;


  });


// Modifications
function edit(fileName, save) {
  isLoaded=true;
  var scope = angular.element($('body').get(0)).scope();

  scope.$apply(function () {
    scope.save = save;
    scope.fileName = fileName;
  });
}

var app = angular.module('shelter', []);

app.controller('dwellerController', function ($scope) {

  $scope.section = 'vault';

  $scope.fileName = '';
  $scope.dweller = {};
  $scope.statsName = ['Unknown', 'S.', 'P.', 'E.', 'C.', 'I.', 'A.', 'L.'];
  
  $scope.wastelandTeams = [];
  $scope.wastelandTeams2 = [];
  $scope.team = {};
  $scope.actor = {};

  var _save = {},
    _lunchboxCount = 0,
    _handyCount = 0,
    _petCarrierCount = 0,
    _starterPackCount = 0,
    _vaultName = -1,
    _skinColor = null,
    _hairColor = null,
    _firstName = null;

    Object.defineProperty($scope, 'firstName', {
      get: function () {
        return _firstName
      },
      set: function (val) {

        _firstName = val;
        if(val.trim().length == 0)
        {
          $scope.dweller.name = "Vault Dweller";
        }
        else
        {
          $scope.dweller.name = val;
        }
      }
    });

    Object.defineProperty($scope, 'vaultName', {
      get: function () {
        if(_vaultName == -1 && $scope.save !== undefined && $scope.save.vault !== undefined) _vaultName = parseInt($scope.save.vault.VaultName);
        return _vaultName
      },
      set: function (val) {
        if(val == null) val = 0;
        _vaultName = val;
        var str = "" + val;
        while(str.length < 3) str = "0" + str;
        $scope.save.vault.VaultName = str;
      }
    });

    Object.defineProperty($scope, 'skinColor', {
      get: function () {
        return _skinColor
      },
      set: function (val) {
        _skinColor = val;
        $scope.dweller.skinColor = colorConverter(val);
      }
    });

    Object.defineProperty($scope, 'hairColor', {
      get: function () {
        return _hairColor
      },
      set: function (val) {
        _hairColor = val;
        $scope.dweller.hairColor = colorConverter(val);
      }
    });

  Object.defineProperty($scope, 'save', {
    get: function () {
      return _save
    },
    set: function (val) {
      _save = val;

      extractCount();
      extractTeams();
    }
  });

  Object.defineProperty($scope, 'lunchboxCount', {
    get: function () {
      return _lunchboxCount
    },
    set: function (val) {
      _lunchboxCount = val;

      updateCount();
    }
  });

  Object.defineProperty($scope, 'handyCount', {
    get: function () {
      return _handyCount
    },
    set: function (val) {
      _handyCount = val;

      updateCount();
    }
  });

  Object.defineProperty($scope, 'petCarrierCount', {
    get: function () {
      return _petCarrierCount
    },
    set: function (val) {
      _petCarrierCount = val;

      updateCount();
    }
  });

  Object.defineProperty($scope, 'starterPackCount', {
    get: function () {
      return _starterPackCount
    },
    set: function (val) {
      _starterPackCount = val;

      updateCount();
    }
  });
  
  Object.defineProperty($scope, 'elapsedTimeAliveExploring', {
    get: function () {
      return $scope.team.elapsedTimeAliveExploring;
    },
    set: function (val) {
      $scope.team.elapsedTimeAliveExploring = val;

      updateTeam();
    }
  });

  Object.defineProperty($scope, 'returnTripDuration', {
    get: function () {
      return $scope.team.returnTripDuration;
    },
    set: function (val) {
      $scope.team.returnTripDuration = val;

      updateTeam();
    }
  });
  
  Object.defineProperty($scope, 'teamEquipment', {
    get: function () {
      return $scope.team.teamEquipment;
    },
    set: function (val) {
      $scope.team.teamEquipment = val;

      updateTeam();
    }
  });


  $scope.editDweller = function (dweller) {
    $scope.dweller = dweller;
    _firstName = $scope.dweller.name;
    _skinColor = colorConverter($scope.dweller.skinColor, true);
    _hairColor = colorConverter($scope.dweller.hairColor, true);
    setTimeout(colorHack, 200);
  };

  $scope.maxhappinessAll = function () {
    var sum2 = Object.keys($scope.save.dwellers.dwellers).length;
    for(i=0; i<sum2; i++)
    $scope.save.dwellers.dwellers[i].happiness.happinessValue = 100;
  };

  $scope.healAll = function () {
    var sum2 = Object.keys($scope.save.dwellers.dwellers).length;
    for(i=0; i<sum2; i++)
    {
      $scope.save.dwellers.dwellers[i].health.radiationValue = 0;
      $scope.save.dwellers.dwellers[i].health.healthValue = $scope.save.dwellers.dwellers[i].health.maxHealth;
    }
  };

  $scope.maxSpecialAll = function () {
    var sum2 = Object.keys($scope.save.dwellers.dwellers).length;
    for(i=0; i<sum2; i++)
    for(i2=0; i2<8; i2++)
    $scope.save.dwellers.dwellers[i].stats.stats[i2].value = 10;
  };

  $scope.maxSpecial = function () {
    $scope.dweller.stats.stats[1].value = 10;
    $scope.dweller.stats.stats[2].value = 10;
    $scope.dweller.stats.stats[3].value = 10;
    $scope.dweller.stats.stats[4].value = 10;
    $scope.dweller.stats.stats[5].value = 10;
    $scope.dweller.stats.stats[6].value = 10;
    $scope.dweller.stats.stats[7].value = 10;
  };

  $scope.removeRocks = function () {
    $scope.save.vault.rocks = [];
  };

  $scope.closeDweller = function (dweller) {
    $scope.dweller = {};
  };
  
  $scope.editTeam = function (team) {
    $scope.team = team;
  };

  $scope.closeTeam = function () {
    $scope.team = {};
  };

  $scope.download = function () {
    encrypt(document.getElementById("presetSaveName").value, $scope.save);
  };
  
  $scope.clearemergency = function () {
    var sum2 = Object.keys($scope.save.vault.rooms).length;
    for(i=0; i<sum2; i++)
    {
      $scope.save.vault.rooms[i].currentStateName = "Idle";
    }
  };
  
  $scope.removedwellersWaiting = function () {
    $scope.save.dwellerSpawner.dwellersWaiting = [];
  };
  
  $scope.unlockthemes = function () {
    var sum2 = Object.keys($scope.save.survivalW.collectedThemes.themeList).length;
    for(i=0; i<sum2; i++)
    {
      $scope.save.survivalW.collectedThemes.themeList[i].extraData.partsCollectedCount = 9;
      $scope.save.survivalW.collectedThemes.themeList[i].extraData.IsNew = true;
    }
  };

  $scope.colortofos = colortofos;

  $scope.unlockrooms = function () {
    $scope.save.unlockableMgr.objectivesInProgress = [];
    $scope.save.unlockableMgr.completed = [];
    $scope.save.unlockableMgr.claimed = ["StorageUnlock",
      "MedbayUnlock",
      "SciencelabUnlock",
      "OverseerUnlock",
      "RadioStationUnlock",
      "WeaponFactoryUnlock",
      "GymUnlock",
      "DojoUnlock",
      "ArmoryUnlock",
      "ClassUnlock",
      "OutfitFactoryUnlock",
      "CardioUnlock",
      "BarUnlock",
      "GameRoomUnlock",
      "BarberShopUnlock",
      "PowerPlantUnlock",
      "WaterroomUnlock",
      "HydroponicUnlock",
      "NukacolaUnlock",
      "DesignFactoryUnlock"];
  };

  $scope.unlockrecipes = function () {
      $scope.save.survivalW.recipes =[
      "Shotgun_Rusty",
      "Railgun",
      "LaserPistol_Focused",
      "PlasmaThrower_Boosted",
      "PlasmaThrower_Overcharged",
      "PipePistol_LittleBrother",
      "CombatShotgun_Hardened",
      "Flamer_Rusty",
      "LaserRifle_Tuned",
      "HuntingRifle_OlPainless",
      "PlasmaRifle_Focused",
      "PipeRifle",
      "JunkJet_Tactical",
      "InstitutePistol_Improved",
      "BBGun_RedRocket",
      "032Pistol_Hardened",
      "InstitutePistol_Apotheosis",
      "InstitutePistol_Scattered",
      "InstituteRifle_Excited",
      "PipeRifle_Long",
      "GatlingLaser",
      "PlasmaThrower_DragonsMaw",
      "PlasmaRifle",
      "AssaultRifle_Rusty",
      "AlienBlaster_Destabilizer",
      "Fatman_Guided",
      "Melee_RaiderSword",
      "SniperRifle_Hardened",
      "Melee_BaseballBat",
      "PlasmaRifle_MeanGreenMonster",
      "032Pistol_WildBillsSidearm",
      "GaussRifle",
      "LaserRifle_WaserWifle",
      "InstitutePistol_Scoped",
      "Flamer_Pressurized",
      "AssaultRifle_ArmorPiercing",
      "Railgun_Rusty",
      "Minigun_Hardened",
      "InstituteRifle_VirgilsRifle",
      "JunkJet_Electrified",
      "Flamer_Hardened",
      "GatlingLaser_Focused",
      "Magnum_Hardened",
      "Railgun_Railmaster",
      "Melee_PoolCue",
      "Minigun_Enhanced",
      "GaussRifle_Rusty",
      "JunkJet_RecoilCompensated",
      "Pistol_LoneWanderer",
      "MissilLauncher",
      "LaserPistol",
      "InstitutePistol_Incendiary",
      "BBGun_ArmorPiercing",
      "Rifle_ArmorPiercing",
      "AssaultRifle_Enhanced",
      "LaserRifle_Rusty",
      "CombatShotgun",
      "GatlingLaser_Tuned",
      "SawedOffShotgun_Hardened",
      "PlasmaThrower_Agitated",
      "Magnum_Blackhawk",
      "AssaultRifle_Infiltrator",
      "PlasmaPistol_MPLXNovasurge",
      "HuntingRifle_ArmorPiercing",
      "Railgun_Enhanced",
      "SniperRifle_Enhanced",
      "GaussRifle_Accelerated",
      "PlasmaThrower_Tactical",
      "CombatShotgun_Rusty",
      "PipeRifle_Bayoneted",
      "GaussRifle_Hardened",
      "PlasmaThrower",
      "AlienBlaster_Focused",
      "SawedOffShotgun_Kneecapper",
      "Flamer_Enhanced",
      "Railgun_Hardened",
      "GaussRifle_Magnetro4000",
      "PipePistol_Auto",
      "SniperRifle_ArmorPiercing",
      "PipeRifle_NightVision",
      "MissilLauncher_Enhanced",
      "PipeRifle_Calibrated",
      "LaserMusket",
      "Rifle_Hardened",
      "Fatman_Enhanced",
      "JunkJet",
      "PlasmaRifle_Amplified",
      "Minigun_Rusty",
      "Melee_FireHydrantBat",
      "GatlingLaser_Amplified",
      "JunkJet_Flaming",
      "Shotgun_DoubleBarrelled",
      "LaserPistol_Amplified",
      "AlienBlaster_Amplified",
      "InstituteRifle_NightVision",
      "SniperRifle_VictoryRifle",
      "PlasmaPistol",
      "Minigun_LeadBelcher",
      "Melee_ButcherKnife",
      "AssaultRifle",
      "Shotgun_Hardened",
      "MissilLauncher_Hardened",
      "LaserRifle_Focused",
      "AlienBlaster",
      "Melee_Pickaxe",
      "032Pistol_ArmorPiercing",
      "SniperRifle",
      "Pistol_ArmorPiercing",
      "PlasmaPistol_Tuned",
      "Melee_KitchenKnife",
      "AssaultRifle_Hardened",
      "Fatman_Hardened",
      "Shotgun_FarmersDaughter",
      "CombatShotgun_CharonsShotgun",
      "AlienBlaster_Rusty",
      "GatlingLaser_Vengeance",
      "InstituteRifle_Long",
      "JunkJet_TechniciansRevenge",
      "LaserPistol_SmugglersEnd",
      "Flamer_Burnmaster",
      "SniperRifle_Rusty",
      "InstituteRifle",
      "MissilLauncher_MissLauncher",
      "InstituteRifle_Targeting",
      "Fatman_Rusty",
      "Rifle_LincolnsRepeater",
      "PipeRifle_BigSister",
      "Fatman",
      "GatlingLaser_Rusty",
      "Fatman_Mirv",
      "PlasmaPistol_Focused",
      "Shotgun_Enhanced",
      "PipePistol_Scoped",
      "Minigun",
      "InstitutePistol",
      "ProfessorSpecial",
      "PiperSpecial",
      "AllNightware_Lucky",
      "KnightSpecial",
      "BowlingShirt",
      "HunterGear_Bounty",
      "BattleArmor_Sturdy",
      "ColonelSpecial",
      "UtilityJumpsuit_Sturdy",
      "DooWopOutfit",
      "PowerArmor_51f",
      "PowerArmor_MkVI",
      "PowerArmor_51d",
      "PowerArmor_51a",
      "BishopSpecial",
      "FlightSuit_Advanced",
      "SodaFountainDress",
      "HandymanJumpsuit_Expert",
      "HandymanJumpsuit_Advanced",
      "GreaserSpecial",
      "ThreedogSpecial",
      "WastelandSurgeon_Doctor",
      "PowerArmor_T45f",
      "CromwellSpecial",
      "PowerArmor_T45d",
      "WandererArmor_Sturdy",
      "LifeguardOutfit",
      "WrestlerSpecial",
      "EngineerSpecial",
      "MilitaryJumpsuit_Officer",
      "PrestonSpecial",
      "HazmatSuit_Heavy",
      "CombatArmor_Heavy",
      "RaiderArmor_Sturdy",
      "SlasherSpecial",
      "AlistairSpecial",
      "SurvivorSpecial",
      "AllNightware_Naughty",
      "InstituteJumper_Advanced",
      "SurgeonSpecial",
      "MayorSpecial",
      "RiotGear_Sturdy",
      "ScifiSpecial",
      "MetalArmor_Sturdy",
      "BOSUniform",
      "SynthArmor_Heavy",
      "Vest",
      "BittercupSpecial",
      "SoldierSpecial",
      "UtilityJumpsuit_Heavy",
      "HunterGear_Mutant",
      "AbrahamSpecial",
      "EulogyJonesSpecial",
      "PowerArmor_MkIV",
      "BaseballUniform",
      "PowerArmor_T60a",
      "PowerArmor_T60d",
      "FormalWear_Lucky",
      "PowerArmor_T60f",
      "Swimsuit",
      "LabCoat_Expert",
      "LabCoat_Advanced",
      "EmpressSpecial",
      "LibrarianSpecial",
      "KingSpecial",
      "MilitaryJumpsuit_Commander",
      "ScribeRobe",
      "BOSUniform_Expert",
      "LucasSpecial",
      "PrinceSpecial",
      "WandererArmor_Heavy",
      "RadiationSuit_Expert",
      "ScientistScrubs_Commander",
      "HazmatSuit_Sturdy",
      "MetalArmor_Heavy",
      "ButchSpecial",
      "ComedianSpecial",
      "RaiderArmor_Heavy",
      "FlightSuit_Expert",
      "SportsfanSpecial",
      "RothchildSpecial",
      "LabCoat",
      "BattleArmor",
      "BattleArmor_Heavy",
      "CombatArmor",
      "CombatArmor_Sturdy",
      "WandererArmor",
      "RaiderArmor",
      "WastelandSurgeon",
      "HunterGear_Treasure",
      "RiotGear",
      "RiotGear_Heavy",
      "SequinDress",
      "WastelandSurgeon_Settler",
      "HandymanJumpsuit",
      "MechanicJumpsuit",
      "InstituteJumper_Expert",
      "UtilityJumpsuit",
      "AllNightware",
      "WorkDress",
      "MilitaryJumpsuit",
      "FormalWear",
      "FormalWear_Fancy",
      "CheckeredShirt",
      "SweaterVest",
      "PowerArmor",
      "PowerArmor_MkI",
      "ScribeRobe_Initiate",
      "ScribeRobe_Elder",
      "RadiationSuit_Advanced",
      "RadiationSuit",
      "MoviefanSpecial",
      "NinjaSuit",
      "FlightSuit",
      "HazmatSuit",
      "BOSUniform_Advanced",
      "ScientistScrubs_Officer",
      "ScientistScrubs",
      "PolkaDotDress",
      "032Pistol",
      "032Pistol_Enhanced",
      "032Pistol_Rusty",
      "AlienBlaster_Tuned",
      "BBGun",
      "BBGun_Enhanced",
      "BBGun_Hardened",
      "BBGun_Rusty",
      "CombatShotgun_DoubleBarrelled",
      "CombatShotgun_Enhanced",
      "Flamer",
      "GaussRifle_Enhanced",
      "HuntingRifle",
      "HuntingRifle_Enhanced",
      "HuntingRifle_Hardened",
      "HuntingRifle_Rusty",
      "LaserPistol_Rusty",
      "LaserPistol_Tuned",
      "LaserRifle",
      "LaserRifle_Amplified",
      "Magnum",
      "Magnum_ArmorPiercing",
      "Magnum_Enhanced",
      "Magnum_Rusty",
      "Minigun_ArmorPiercing",
      "MissilLauncher_Guided",
      "MissilLauncher_Rusty",
      "PipePistol",
      "PipePistol_HairTrigger",
      "PipePistol_Heavy",
      "Pistol",
      "Pistol_Enhanced",
      "Pistol_Hardened",
      "Pistol_Rusty",
      "PlasmaPistol_Amplified",
      "PlasmaPistol_Rusty",
      "PlasmaRifle_Rusty",
      "PlasmaRifle_Tuned",
      "Railgun_Accelerated",
      "Rifle",
      "Rifle_Enhanced",
      "Rifle_Rusty",
      "SawedOffShotgun",
      "SawedOffShotgun_DoubleBarrelled",
      "SawedOffShotgun_Enhanced",
      "SawedOffShotgun_Rusty",
      "Shotgun"];
  }

  function extractCount() {


    if ($scope.save.vault.LunchBoxesByType.toString().indexOf("0") > -1){
      _lunchboxCount = $scope.save.vault.LunchBoxesByType.toString().match(/0/g).length;
    } else {
      _lunchboxCount = 0;
    }

    if ($scope.save.vault.LunchBoxesByType.toString().indexOf("1") > -1){
      _handyCount = $scope.save.vault.LunchBoxesByType.toString().match(/1/g).length;
    } else {
      _handyCount = 0;
    }

    if ($scope.save.vault.LunchBoxesByType.toString().indexOf("2") > -1){
      _petCarrierCount = $scope.save.vault.LunchBoxesByType.toString().match(/2/g).length;
    } else {
      _petCarrierCount = 0;
    }

    if ($scope.save.vault.LunchBoxesByType.toString().indexOf("3") > -1){
      _starterPackCount = $scope.save.vault.LunchBoxesByType.toString().match(/3/g).length;
    } else {
      _starterPackCount = 0;
    }


    $scope.lunchboxCount = _lunchboxCount;
    $scope.handyCount = _handyCount;
    $scope.petCarrierCount = _petCarrierCount;
    $scope.starterPackCount = _starterPackCount;


  }

  function updateCount() {

    var types = $scope.save.vault.LunchBoxesByType = [],
    count = $scope.save.vault.LunchBoxesCount = _lunchboxCount + _handyCount + _petCarrierCount + _starterPackCount;

    for (var i = 0; i < _lunchboxCount; i++){
      types.push(0);
    }

    for (var i = 0; i < _handyCount; i++){
      types.push(1);
    }

    for (var i = 0; i < _petCarrierCount; i++){
      types.push(2);
    }

    for (var i = 0; i < _starterPackCount; i++){
      types.push(3);
    }

  }
  
  function extractTeams() {
    $scope.save.vault.wasteland.teams.forEach(function (team) {
      $scope.wastelandTeams.push({
        teamIndex: team.teamIndex,
        dweller: findDweller(team.dwellers[0]),
        elapsedTimeAliveExploring: team.elapsedTimeAliveExploring,
        returnTripDuration: team.returnTripDuration,
        teamEquipment: team.teamEquipment
      });
      $scope.wastelandTeams2.push({
        teamIndex: team.teamIndex,
        actor: findActor(team.actors[0]),
        elapsedTimeAliveExploring: team.elapsedTimeAliveExploring,
        returnTripDuration: team.returnTripDuration,
        teamEquipment: team.teamEquipment
      });
    });
  }
  
  function findDweller(id) {
    var dweller = null;

    $scope.save.dwellers.dwellers.forEach(function (d) {
      if (d.serializeId == id) {
        dweller = d;
      }
    });

    return dweller;
  }
  
  function findActor(id) {
    var actor = null;

    $scope.save.dwellers.actors.forEach(function (d) {
      if (d.serializeId == id) {
        actor = d;
      }
    });

    return actor;
  }

  function updateTeam() {
    $scope.save.vault.wasteland.teams.forEach(function (team) {
      if (team.teamIndex == $scope.team.teamIndex) {
        team.elapsedTimeAliveExploring = $scope.team.elapsedTimeAliveExploring;
        team.returnTripDuration = $scope.team.returnTripDuration;
        team.teamEquipment = $scope.team.teamEquipment;
      }
    });
  }

});



function preset(preset, saveFileName){

  /*
  if(isLoaded){
    if(window.location.href.indexOf("?") > -1){
      window.location.href = window.location.href.substring(0,window.location.href.indexOf("?")) +  "?preset=" + preset + "?savename=" + saveFileName;
    }else{
      window.location.href = window.location.href +  "?preset=" + preset + "?savename=" + saveFileName;

    }
    throw new Error("There already is a savefile loaded.")

  }  */ // Why does this matter?

  file = "presets/" + preset + ".json";

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = readPreset;

  xhr.open("GET", file, true);
  xhr.send();


  function readPreset()
  {

    if (xhr.readyState == 4) {
      var resp = JSON.parse(xhr.responseText);
      $('.instructions').hide();

      edit(saveFileName, resp);
    }

  };



}
