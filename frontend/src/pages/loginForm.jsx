import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, LockKeyhole, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/hooks/use-toast"

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Validation schema
  const validationSchema = {
    email: {
      required: "Email is required",
      pattern: {
        value: "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$",
        message: "Invalid email address"
      }
    },
    password: {
      required: "Password is required",
      minLength: {
        value: 6,
        message: "Password must be at least 6 characters"
      }
    }
  };

  // Helper to extract data using path
  const getDataFromPath = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  };

  const handleStorage = (items) => {
    items.forEach(({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  };

  const showNotification = (type, message) => {
    if (type === 'success') {
      toast({
        title: message,
        variant: 'success',
        className: 'bg-green-50 p-4 rounded-md'
      });
    } else {
      setApiError(message);
    }
  };

  const handleApiCall = async () => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        remember: formData.remember
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Login failed');
    }

    return data;
  };

  const validateField = (name, value) => {
    const rules = validationSchema[name];
    if (!rules) return "";

    if (rules.required && !value) {
      return rules.required;
    }

    if (rules.pattern && !new RegExp(rules.pattern.value, "i").test(value)) {
      return rules.pattern.message;
    }

    if (rules.minLength && value.length < rules.minLength.value) {
      return rules.minLength.message;
    }

    return "";
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(validationSchema).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return newErrors;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const newValue = type === "checkbox" ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Realtime validation
    const error = validateField(name, newValue);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError("");

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // Handle API call
    setIsLoading(true);
    try {
      const response = await handleApiCall();
      
      // Handle successful login
      handleStorage([
        { key: 'token', value: response.data.accessToken },
        { key: 'user', value: response.data.user }
      ]);
      
      showNotification('success', 'Login successful');
      navigate('/dashboard');
    } catch (error) {
      showNotification('error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md bg-white shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-gray-900">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center text-gray-500">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {apiError && (
              <div className="text-sm text-red-500 text-center">
                <AlertCircle className="h-4 w-4 inline-block mr-1" />
                {apiError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3" />
                <Input 
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  className={errors.email ? 
                    "pl-10 w-full border-red-500 focus:ring-red-500 rounded-md" :
                    "pl-10 w-full border border-gray-300 rounded-md"
                  }
                  value={formData.email || ''}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <div className="text-sm text-red-500 mt-1">
                  {errors.email}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3" />
                <Input 
                  id="password"
                  name="password"
                  type="password"
                  className={errors.password ? 
                    "pl-10 w-full border-red-500 focus:ring-red-500 rounded-md" :
                    "pl-10 w-full border border-gray-300 rounded-md"
                  }
                  value={formData.password || ''}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <div className="text-sm text-red-500 mt-1">
                  {errors.password}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember"
                name="remember"
                checked={formData.remember || false}
                onCheckedChange={(checked) => 
                  handleChange({ target: { name: 'remember', type: 'checkbox', checked }})
                }
                disabled={isLoading}
              />
              <Label htmlFor="remember" className="text-sm text-gray-500">
                Remember me
              </Label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit"
              className={isLoading ? 
                "w-full bg-blue-400 text-white py-2 rounded-md cursor-not-allowed" :
                "w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
              }
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Signing in...
                </>
              ) : 'Sign in'}
            </Button>
            <div className="text-sm text-center text-gray-500">
              Don't have an account?{' '}
              <a 
                href="/signup" 
                className="text-blue-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/signup');
                }}
              >
                Sign up
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;