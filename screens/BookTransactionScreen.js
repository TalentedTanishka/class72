import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet,TextInput,KeyboardAvoidingView } from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as firebase from 'firebase';
import db from '../config.js';

export default class TransactionScreen extends React.Component {
    constructor(){
      super();
      this.state = {
        hasCameraPermissions: null,
        scanned: false,
      studentscanneddata:'',
      bookidscanneddata:'',
        buttonState: 'normal',
        transactionMessage:''
      }
    }

    getCameraPermissions = async (id) =>{
      const {status} = await Permissions.askAsync(Permissions.CAMERA);
      
      this.setState({
        /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
        hasCameraPermissions: status === "granted",
        buttonState: id,
        scanned: false
      });
    }

    handleBarCodeScanned = async({type, data})=>{
     const {buttonState}=this.state
     if(buttonState==="bookid")
     {
       this.setState({
         scanned:true,
         studentscanneddata:data,
         buttonState:'normal'
       })
     }
     else if(buttonState==="studentid")
     {
      this.setState({
        scanned:true,
        bookidscanneddata:data,
        buttonState:'normal'
      })
     }
    }

    initiateBookIssue=async()=>{
        db.collection("transactions").add({"studentid":this.state.studentscanneddata,
        "bookid":this.state.bookidscanneddata,
        "date":firebase.firestore.Timestamp.now().toDate(),
        "transactiontype":"Issue"})

        db.collection("books").doc(this.state.bookidscanneddata).update({
            "bookAvailability":false
        })
        db.collection("students").doc(this.state.studentscanneddata).update({
            "noofbookissue":firebase.firestore.FieldValue.increment(1)
        })
    }

    initiateBookReturn=async()=>{
        db.collection("transactions").add({"studentid":this.state.studentscanneddata,
        "bookid":this.state.bookidscanneddata,
        "date":firebase.firestore.Timestamp.now().toDate(),
        "transactiontype":"Return"})

        db.collection("books").doc(this.state.bookidscanneddata).update({
            "bookAvailability":true
        })
        db.collection("students").doc(this.state.studentscanneddata).update({
            "noofbookissue":firebase.firestore.FieldValue.increment(-1)
        })
    }

    handleTransaction=async()=>{
      var transactionMessage
      db.collection("books").doc(this.state.bookidscanneddata).get()
      .then((doc)=>{
        console.log(doc.data())
        var book=doc.data()
        if(book.bookAvailability)
        {
          this.initiateBookIssue()
          transactionMessage="Book issue"
        }
        else
        {
          this.initiateBookReturn()
          transactionMessage="Book return"
        }
      })
      this.setState({
        transactionMessage:transactionMessage
      })
    }
    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;

      if (buttonState !== "normal" && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        );
      }

      else if (buttonState === "normal"){
        return(
          <KeyboardAvoidingView style={styles.container} behavior='padding' enabled>

          <View style={styles.inputview}>
            <TextInput style={styles.inputbox} onChangeText={(text)=>{
                this.setState({
                  bookidscanneddata:text
                })
            }} placeholder="book id" value={this.state.bookidscanneddata}></TextInput>
            <TouchableOpacity style={styles.scanButton} onPress={()=>{
              this.getCameraPermissions("bookid")
            }}>
              <Text style={styles.buttonText}>
                Scan
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputview}>
          <TextInput style={styles.inputbox} onChangeText={(text)=>{
                this.setState({
                  studentscanneddata:text
                })
            }} placeholder="student id" value={this.state.studentscanneddata}></TextInput>
            <TouchableOpacity style={styles.scanButton} onPress={()=>{
              this.getCameraPermissions("studentid")
            }}>
              <Text style={styles.buttonText}>
                Scan
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.submitbutton} onPress={async()=>{await this.handleTransaction}}>
<Text style={styles.submitbuttontext}>
  Submit
</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
        );
      }
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      margin: 10
    },
    buttonText:{
      fontSize: 15,
      textAlign: 'center',
      marginTop: 10
    },
    inputView:{
      flexDirection: 'row',
      margin: 20
    },
    inputBox:{
      width: 200,
      height: 40,
      borderWidth: 1.5,
      borderRightWidth: 0,
      fontSize: 20
    },
    scanButton:{
      backgroundColor: '#66BB6A',
      width: 50,
      borderWidth: 1.5,
      borderLeftWidth: 0
    },
    submitbutton:{
     backgroundColor:"pink",
width:100,
height:50
    },
    submitbuttontext:{
      textAlign:"center",
      fontSize:20,
      fontWeight:"bold",
      fontFamily:"Comic Sans MS",
      color:"black"
        }
  });