import React from 'react'
import {
  useUser,
  withUser,
  withUserTokenSSR,
  AuthAction,
} from 'next-firebase-auth'
import Header from '../components/Header'
import DemoPageLinks from '../components/DemoPageLinks'
import getAbsoluteURL from '../utils/getAbsoluteURL'

const styles = {
  content: {
    padding: 32,
  },
  infoTextContainer: {
    marginBottom: 32,
  },
}

const Demo = ({ favoriteColor, favoriteAnimal, email }) => {
  const user = useUser()
  return (
    <div>
      <Header email={user.email} signOut={user.signOut} />
      <div style={styles.content}>
        <div style={styles.infoTextContainer}>
          <h3>Example: SSR + data fetching</h3>
          <p>
            This page requires authentication. It will do a server-side redirect
            (307) to the login page if the auth cookies are not set.
          </p>
          <p>Your favorite color is: {favoriteColor}</p>
          <p>
            Your favorite animal is {favoriteAnimal}. Please send lots of photos
            of {favoriteAnimal} to {email}.
          </p>
        </div>
        <DemoPageLinks />
      </div>
    </div>
  )
}

export const getServerSideProps = withUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ user, req }) => {
  // Optionally, get other props.
  // You can return anything you'd normally return from
  // `getServerSideProps`, including redirects.
  // https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering
  const token = await user.getIdToken()

  // This endpoint uses an ID token.
  // Note: you shouldn't typically fetch your own API routes from within
  // `getServerSideProps`. This is for example purposes only.
  // https://github.com/gladly-team/next-firebase-auth/issues/264
  const endpoint = getAbsoluteURL('/api/example', req)
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: token || 'unauthenticated',
    },
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(
      `Data fetching failed with status ${response.status}: ${JSON.stringify(
        data
      )}`
    )
  }

  // This API endpoint uses cookies rather than an ID token.
  const endpointTwo = getAbsoluteURL('/api/cookies-example', req)
  const responseTwo = await fetch(endpointTwo, {
    method: 'GET',
    // No Authorization header required, but we need to pass cookies.
    headers: {
      cookie: req.headers.cookie,
    },
    credentials: 'include',
  })
  const dataTwo = await responseTwo.json()
  if (!responseTwo.ok) {
    throw new Error(
      `Data fetching (using cookies) failed with status ${
        responseTwo.status
      }: ${JSON.stringify(dataTwo)}`
    )
  }

  return {
    props: {
      favoriteColor: data.favoriteColor,
      favoriteAnimal: dataTwo.favoriteAnimal,
      email: dataTwo.email,
    },
  }
})

export default withUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(Demo)
