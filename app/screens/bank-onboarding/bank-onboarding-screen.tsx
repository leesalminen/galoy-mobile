import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Screen } from "../../components/screen"
import { OnboardingScreen } from "../../components/onboarding"
import { Text } from "../../components/text"
import { StyleSheet, Alert } from "react-native"
import { BalanceHeader } from "../../components/balance-header"
import { CurrencyType, AccountType, Onboarding } from "../../utils/enum"
import { useNavigation } from "react-navigation-hooks"
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input, Button } from "react-native-elements"
import { Button as ButtonNative } from "react-native"
import { withNavigation } from "react-navigation"
import functions from "@react-native-firebase/functions"
import { inject } from "mobx-react"
import { GetReward } from "../../components/rewards"
import { Loader } from "../../components/loader"


export const bankLogo = require("./BankLogo.png")
export const popcornLogo = require("../welcome-sync/PopcornLogo.png")

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    paddingHorizontal: 40,
    fontWeight: 'bold'
  },

  text: {
    fontSize: 18,
    textAlign: "center",
    paddingHorizontal: 40,
  },

})

export const OpenBankAccountScreen = () => {
  const { navigate } = useNavigation()
  return (
    <Screen>
      <BalanceHeader headingCurrency={CurrencyType.USD} accountsToAdd={AccountType.Checking} />
      <Text style={styles.title}>Open a Galoy bank account</Text>
      <Text style={styles.text}>Hold US dollars in your account! Order a debit card to earn 1%+ cashback in bitcoin on your spending! And easily buy & sell bitcoin in-app.</Text>
      <Button title="Open account" onPress={() => navigate('bankRewards')} />
    </Screen>
  )
}


export const BankRewardsScreen = inject('dataStore')(
  ({ dataStore }) => {

  return (
    <Screen>
      { dataStore.onboarding.stage == Onboarding.walletOnboarded &&
      <OnboardingScreen next="personalInformation" image={bankLogo}>
        <Text style={styles.text}>You’re just a few minutes away from own Galoy bank account! Order a debit card to receive 1% bitcoin rewards on all spending.</Text>
      </OnboardingScreen>
      }
      { dataStore.onboarding.stage == Onboarding.bankOnboarded &&
        <>
          <Text style={styles.text}>You already have a bank account</Text>
          <Text style={styles.text}>(And this screen should not be accessible, this is a bug)</Text>
        </>
      }
    </Screen>
  )
})


BankRewardsScreen.navigationOptions = screenProps => ({
  title: "Bank rewards",
  headerLeft: (
    <ButtonNative title="< Back" onPress={() => screenProps.navigation.goBack(null)} />
  ), // FIXME
})


export const PersonalInformationScreen = () => {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")

  const secondTextInput = useRef(null);
  const thirdTextInput = useRef(null);

  const { navigate } = useNavigation()

  const onValidate = () => {
    navigate('dateOfBirth', {firstName, lastName, email})
  } 

  return (
    <Screen>
      <Text style={styles.text}>To get started, tell us about yourself.</Text>
      <Input 
        placeholder='First Name'
        onChangeText={input => setFirstName(input)} 
        autoFocus={true}     
        returnKeyType = { "next" }
        blurOnSubmit={false}
        textContentType="givenName"
        onSubmitEditing={() => { secondTextInput.current.focus() }}
        />
      <Input
        placeholder='Last Name'
        onChangeText={input => setLastName(input)}
        ref={secondTextInput}
        returnKeyType = { "next" }
        blurOnSubmit={false}
        textContentType="familyName"
        onSubmitEditing={() => { thirdTextInput.current.focus() }}
          />
      <Input 
        placeholder='Email'
        onChangeText={input => setEmail(input)}
        ref={thirdTextInput}
        returnKeyType = { "done" }
        textContentType="emailAddress"
        blurOnSubmit={true}
        onSubmitEditing={onValidate}
      />

      <Text style={styles.text}>Your information is encrypted and securely transmit using SSL</Text>
      <Button title="Confirm" onPress={onValidate} />
    </Screen>
  )
}


export const DateOfBirthScreen = withNavigation(inject("dataStore")(
  ({ navigation, dataStore }) => {

  const [dateOfBirth, setDateOfBirth] = useState(new Date(2000, 1, 1))
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")

  const onValidate = async () => {

    try {
      setLoading(true)
      await functions().httpsCallable("onBankAccountOpening")
        ({...navigation.state.params, dateOfBirth: dateOfBirth.toISOString()})
      await GetReward({
        value: 100000,
        memo: "Bank account opening",
        lnd: dataStore.lnd,
        setErr
      })
      dataStore.onboarding.set(Onboarding.bankOnboarded)
      navigation.navigate('bankAccountReady')
      setLoading(false)
    } catch (err) {
      console.tron.error(err)
      setErr(err.toString())
    }
  }

  useEffect(() => {
    if (err !== "") {
      Alert.alert("error", err, [
        {
          text: "OK",
          onPress: () => {
            setLoading(false)
          },
        },
      ])
      setErr("")
    }
  }, [err])

  return (
    <Screen>
      <Loader loading={loading} />
      <Text style={styles.text}>Date of Birth</Text>
      <DateTimePicker 
                    mode="date"
                    display="default"
                    value={dateOfBirth}
                    onChange={(_, input) => {
                      setDateOfBirth(input);
                    }} /> 
                    {/* FIXME could timezone be an issue?  */}
      <Text style={styles.text}>
        Your information is encrypted and securely transmit using SSL
      </Text>
      <Button title="Confirm" onPress={onValidate} />
    </Screen>
  )
}))


export const BankAccountReadyScreen = () => {

  return (
    <Screen>
      <OnboardingScreen next="accounts" nextTitle="Okay" image={popcornLogo}>
        <Text style={styles.text}>Your Galoy bank account is ready!!</Text>
      </OnboardingScreen>
    </Screen>
  )
}

BankAccountReadyScreen.navigationOptions = screenProps => ({
  title: "Bank Account",
  header: false,
})
