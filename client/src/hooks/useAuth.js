import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser, selectIsAuthenticated, selectAuthLoading, loginUser, logoutUser, registerUser, updateUser } from '../redux/slices/authSlice'

const useAuth = () => {
  const dispatch = useDispatch()
  const user = useSelector(selectCurrentUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isLoading = useSelector(selectAuthLoading)

  return {
    user,
    isAuthenticated,
    isLoading,
    login: (credentials) => dispatch(loginUser(credentials)),
    register: (data) => dispatch(registerUser(data)),
    logout: () => dispatch(logoutUser()),
    updateProfile: (data) => dispatch(updateUser(data)),
  }
}

export default useAuth
