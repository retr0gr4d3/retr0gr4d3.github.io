# YOU MUST HAVE MADE IT PAST THE IN-GAME TUTORIAL FOR ANY SAVE EDIT TO OCCUR.
# YOU DO NOT NEED TO USE YOUR XBOX PRIMARILY TO MAKE IT PAST TUTORIAL. WINDOWS 10 EDITION IS KNOWN AS "PLAY ANYWHERE", WHICH IS LITERALLY ANYWHERE. ONCE SYNCED, IT STAYS THAT WAY.

# WINDOWS 10 PLAY ANYWHERE (PC, XBOX, ANY WINDOWS DEVICE THAT HAS IT ON THE STORE)
- Install the Play Anywhere Version from the Store.
Start the Store-Version and create a new Vault. Click thourgh the tutorial until you can open the Settings-Page.
Save your game, then exit to the Main Menu and quit the Application.
Now go to your File-Explorer and open up the Local AppData Directory.
You can find this either under the Path
C:\Users\YOUR_USER_NAME\AppData\Local
or you can enter %appdata% in the Adress-Bar in File-Explorer. This will bring you to the AppData\Roaming Directory, so you have to go up one level and go into Local there.
Once you found that directory, look for the Packages Folder and open it.
Now sort the View by Date->Descending and you should see some Folder named 'BethesdaSoftworks.FalloutShelter_3275kfvn8vcwc' or some different number. Open that one.
A few more directories to traverse, You should follow the Path along
SystemAppData\wgs\BIG_CRYPTIC_NUMBER\ANOTHER_BIG_CRYPTIC_NUMBER
(in my case it was SystemAppData\wgs\0009000002967BFA_0000000000000000000000007FACC08D\21821535E3D44FCBBE5D833C6EBCFACF)
In there you will find 3 Files, two named with (guessed it) cryptic numbers, and one with the name 'container.SOME_NUMBER'. (in my case, it was container.8, but as others stated, it might be a different one)
Now look at the File Sizes. Two of those have a size of 1kb, while the other one is bigger (about 64kb at the start). This is the File we are looking for.
Now grab your Vault-Save from the first step and rename it so that it matches the name of the big file from that directory. Note that you have to REMOVE the extension from your original Vault-Save, the Play Anywhere Versions doesnt have an extension to it.
So for example: 'Vault1.sav' is renamed to 'BB81E4B38B64413D9D5C886B7F9B580B'
Now replace the File in the Folder with your newly renamed one, overwriting the old one.
That's about it. Go start up the Fallout Shelter Play Anywere Version, go to the Vault-List and your Vault should appear :)
The Save-Game will sync with your XBOX ONE and is playable, although as noted above and below, there might be some problems that could manifest later.
