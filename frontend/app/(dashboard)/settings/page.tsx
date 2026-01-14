"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"
import { useAppStore } from "@/store";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { User, Session } from "@/types";
import { api } from "@/lib/api";

const EMOTIONS = ['frustrated', 'confused', 'excited', 'neutral', 'considering'];
const INTERVENTION_ACTIONS = ['show_help_chat', 'show_guide', 'show_social_proof', 'show_comparison', 'none'];

export default function SettingsPage() {
    const {
        website: selectedWebsite,
        updateWebsite,
        loading: websiteLoading,
        error: websiteError,
        success: websiteSuccess,
        clearSuccess: clearWebsiteSuccess,
        user,
        loading: authLoading,
        error: authError,
        success: authSuccess,
        updateAuthenticatedUser,
        clearSuccess: clearAuthSuccess,
        discoverPersonas
    } = useAppStore();

    const [sessions, setSessions] = useState<Session[]>([]);

    useEffect(() => {
        if (selectedWebsite?._id) {
            const fetchSessions = async () => {
                try {
                    const response = await api.get(`/websites/${selectedWebsite._id}/sessions`);
                    setSessions(response.data.data);
                } catch (error) {
                    console.error("Failed to fetch sessions:", error);
                }
            };
            fetchSessions();
        }
    }, [selectedWebsite?._id]);


    const [websiteFormState, setWebsiteFormState] = useState({
        name: selectedWebsite?.name || '',
        domain: selectedWebsite?.domain || '',
        settings: selectedWebsite?.settings || {
            learningPeriodHours: 48,
            autoPersonalization: false,
            experimentMode: false,
            emotionInterventions: [],
            fraudDetectionSettings: {
                sensitivity: 'medium',
                riskBasedActions: {
                    requirePhoneVerification: false,
                    requireEmailVerification: false,
                    disableCOD: false,
                    showCaptcha: false,
                    manualReview: false,
                    limitOrderValue: undefined,
                }
            }
        },
    });

    const [profileFormState, setProfileFormState] = useState<Partial<User>>({
        fullName: user?.fullName || '',
        email: user?.email || '',
        settings: user?.settings || {
            twoFactorEnabled: false,
            emailNotificationsEnabled: true,
            pushNotificationsEnabled: false,
        }
    });

    useEffect(() => {
        if (selectedWebsite) {
            setWebsiteFormState({
                name: selectedWebsite.name,
                domain: selectedWebsite.domain,
                settings: selectedWebsite.settings,
            });
        }
    }, [selectedWebsite]);

    useEffect(() => {
        if (user) {
            setProfileFormState({
                fullName: user.fullName,
                email: user.email,
                settings: user.settings || {
                    twoFactorEnabled: false,
                    emailNotificationsEnabled: true,
                    pushNotificationsEnabled: false,
                }
            });
        }
    }, [user]);

    useEffect(() => {
        if (websiteSuccess) {
            toast({
                title: "Success",
                description: websiteSuccess,
            });
            clearWebsiteSuccess();
        }
        if (websiteError) {
            toast({
                title: "Error",
                description: websiteError,
                variant: "destructive",
            });
            clearWebsiteSuccess();
        }
    }, [websiteSuccess, websiteError, clearWebsiteSuccess, toast]);

    useEffect(() => {
        if (authSuccess) {
            toast({
                title: "Success",
                description: authSuccess,
            });
            clearAuthSuccess();
        }
        if (authError) {
            toast({
                title: "Error",
                description: authError,
                variant: "destructive",
            });
            clearAuthSuccess();
        }
    }, [authSuccess, authError, clearAuthSuccess, toast]);

    const handleFormChange = (field: string, value: any) => {
        setWebsiteFormState((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleWebsiteSettingsChange = (field: string, value: any) => {
        setWebsiteFormState((prev: any) => ({
            ...prev,
            settings: {
                ...prev.settings,
                [field]: value,
            },
        }));
    };

    const handleProfileFormChange = (field: string, value: any) => {
        setProfileFormState((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleProfileSettingsChange = (field: string, value: any) => {
        setProfileFormState((prev) => ({
            ...prev,
            settings: {
                ...prev.settings,
                [field]: value,
            },
        }));
    };

    const handleEmotionInterventionChange = (index: number, field: string, value: any) => {
        const updatedInterventions = [...(websiteFormState.settings.emotionInterventions || [])];
        updatedInterventions[index] = { ...updatedInterventions[index], [field]: value };
        setWebsiteFormState((prev: any) => ({
            ...prev,
            settings: {
                ...prev.settings,
                emotionInterventions: updatedInterventions,
            }
        }));
    };

    const handleAddEmotionIntervention = () => {
        setWebsiteFormState((prev: any) => ({
            ...prev,
            settings: {
                ...prev.settings,
                emotionInterventions: [
                    ...(prev.settings.emotionInterventions || []),
                    { emotion: 'neutral', action: 'none', message: '' },
                ],
            }
        }));
    };

    const handleRemoveEmotionIntervention = (index: number) => {
        setWebsiteFormState((prev: any) => ({
            ...prev,
            settings: {
                ...prev.settings,
                emotionInterventions: prev.settings.emotionInterventions.filter((_: any, i: number) => i !== index),
            }
        }));
    };

    const handleSaveWebsiteSettings = async () => {
        if (!selectedWebsite?._id) {
            toast({
                title: "Error",
                description: "No website selected to save settings.",
                variant: "destructive",
            });
            return;
        }

        if (!websiteFormState.name.trim()) {
            toast({
                title: "Validation Error",
                description: "Website Name cannot be empty.",
                variant: "destructive",
            });
            return;
        }

        if (!websiteFormState.domain.trim()) {
            toast({
                title: "Validation Error",
                description: "Website Domain cannot be empty.",
                variant: "destructive",
            });
            return;
        }

        await updateWebsite(selectedWebsite._id, {
            name: websiteFormState.name,
            domain: websiteFormState.domain,
            settings: websiteFormState.settings,
        });
    };

    const handleSaveProfile = async () => {
        if (!user?._id) {
            toast({
                title: "Error",
                description: "User not authenticated.",
                variant: "destructive",
            });
            return;
        }
        if (!profileFormState.fullName?.trim()) {
            toast({
                title: "Validation Error",
                description: "Full Name cannot be empty.",
                variant: "destructive",
            });
            return;
        }
        await updateAuthenticatedUser({ fullName: profileFormState.fullName });
    };

    const handleSaveSecurity = async () => {
        if (!user?._id) {
            toast({
                title: "Error",
                description: "User not authenticated.",
                variant: "destructive",
            });
            return;
        }
        await updateAuthenticatedUser({ settings: { twoFactorEnabled: profileFormState.settings?.twoFactorEnabled } });
    };

    const handleSaveNotifications = async () => {
        if (!user?._id) {
            toast({
                title: "Error",
                description: "User not authenticated.",
                variant: "destructive",
            });
            return;
        }
        await updateAuthenticatedUser({ 
            settings: {
                emailNotificationsEnabled: profileFormState.settings?.emailNotificationsEnabled,
                pushNotificationsEnabled: profileFormState.settings?.pushNotificationsEnabled,
            }
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Settings</h1>
            
            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="website">Website</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>
                                Make changes to your personal information here. Click save when you're done.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    value={profileFormState.fullName || ''}
                                    onChange={(e) => handleProfileFormChange('fullName', e.target.value)}
                                    disabled={authLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profileFormState.email || ''}
                                    disabled={true}
                                />
                            </div>
                            <Button onClick={handleSaveProfile} disabled={authLoading}>Save changes</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="website">
                    <Card>
                        <CardHeader>
                            <CardTitle>Website Settings</CardTitle>
                            <CardDescription>
                                Manage settings for your currently selected website.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="website-name">Website Name</Label>
                                <Input id="website-name" value={websiteFormState.name} onChange={(e) => handleFormChange('name', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website-domain">Website Domain</Label>
                                <Input id="website-domain" type="url" value={websiteFormState.domain} onChange={(e) => handleFormChange('domain', e.target.value)} />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="auto-personalization" checked={websiteFormState.settings.autoPersonalization} onCheckedChange={(checked: boolean) => handleWebsiteSettingsChange('autoPersonalization', checked)} />
                                <Label htmlFor="auto-personalization">Enable Auto-Personalization</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="experiment-mode" checked={websiteFormState.settings.experimentMode} onCheckedChange={(checked: boolean) => handleWebsiteSettingsChange('experimentMode', checked)} />
                                <Label htmlFor="experiment-mode">Enable Experiment Mode</Label>
                            </div>
                            <Button onClick={handleSaveWebsiteSettings} disabled={websiteLoading}>Save changes</Button>
                        </CardContent>
                    </Card>

                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Persona Discovery</CardTitle>
                            <CardDescription>
                                Manually trigger the persona discovery process. This will analyze the latest user data to identify new personas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => discoverPersonas(selectedWebsite?._id, sessions)} disabled={websiteLoading}>
                                Discover Personas
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Emotion-Based Interventions</CardTitle>
                            <CardDescription>
                                Define automatic actions based on detected user emotions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {websiteFormState.settings.emotionInterventions && websiteFormState.settings.emotionInterventions.map((intervention: any, index: number) => (
                                <div key={index} className="border p-4 rounded-md space-y-3 relative">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                        onClick={() => handleRemoveEmotionIntervention(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <div className="space-y-2">
                                        <Label>Emotion Trigger</Label>
                                        <Select
                                            value={intervention.emotion}
                                            onValueChange={(value: any) => handleEmotionInterventionChange(index, 'emotion', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select emotion" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {EMOTIONS.map(emotion => (
                                                    <SelectItem key={emotion} value={emotion}>{emotion.charAt(0).toUpperCase() + emotion.slice(1)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Intervention Action</Label>
                                        <Select
                                            value={intervention.action}
                                            onValueChange={(value: any) => handleEmotionInterventionChange(index, 'action', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select action" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {INTERVENTION_ACTIONS.map(action => (
                                                    <SelectItem key={action} value={action}>{action.replace(/_/g, ' ')}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {intervention.action !== 'none' && (
                                        <div className="space-y-2">
                                            <Label>Message (Optional)</Label>
                                            <Textarea
                                                value={intervention.message}
                                                onChange={(e) => handleEmotionInterventionChange(index, 'message', e.target.value)}
                                                placeholder="e.g., Need help? Our team is here!"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                            <Button variant="outline" className="w-full" onClick={handleAddEmotionIntervention}>
                                <Plus className="h-4 w-4 mr-2" /> Add Intervention Rule
                            </Button>
                            <Button onClick={handleSaveWebsiteSettings} disabled={websiteLoading}>Save Emotion Settings</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Manage your account's security settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="2fa" className="text-base">Two-Factor Authentication</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Add an extra layer of security to your account.
                                    </p>
                                </div>
                                <Checkbox
                                    id="2fa"
                                    checked={profileFormState.settings?.twoFactorEnabled || false}
                                    onCheckedChange={(checked: boolean) => handleProfileSettingsChange('twoFactorEnabled', checked)}
                                    disabled={authLoading}
                                />
                            </div>
                            <Button onClick={handleSaveSecurity} disabled={authLoading}>Save Security Settings</Button>
                        </CardContent>
                    </Card>

                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Fraud Detection Settings</CardTitle>
                            <CardDescription>
                                Configure the sensitivity and automated actions for fraud detection.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fraud-sensitivity">Sensitivity Level</Label>
                                <Select
                                    value={websiteFormState.settings.fraudDetectionSettings?.sensitivity || 'medium'}
                                    onValueChange={(value: 'low' | 'medium' | 'high') =>
                                        handleWebsiteSettingsChange('fraudDetectionSettings', {
                                            ...websiteFormState.settings.fraudDetectionSettings,
                                            riskBasedActions: {
                                                ...websiteFormState.settings.fraudDetectionSettings?.riskBasedActions,
                                            },
                                            sensitivity: value,
                                        })
                                    }
                                >
                                    <SelectTrigger id="fraud-sensitivity">
                                        <SelectValue placeholder="Select sensitivity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <h3 className="font-semibold mt-4">Risk-Based Actions</h3>
                            <p className="text-sm text-muted-foreground mb-2">Automated actions taken when high fraud risk is detected.</p>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="requirePhoneVerification"
                                        checked={websiteFormState.settings.fraudDetectionSettings?.riskBasedActions?.requirePhoneVerification || false}
                                        onCheckedChange={(checked: boolean) =>
                                            handleWebsiteSettingsChange('fraudDetectionSettings', {
                                                ...websiteFormState.settings.fraudDetectionSettings,
                                                riskBasedActions: {
                                                    ...websiteFormState.settings.fraudDetectionSettings?.riskBasedActions,
                                                    requirePhoneVerification: checked,
                                                },
                                            })
                                        }
                                    />
                                    <Label htmlFor="requirePhoneVerification">Require Phone Verification</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="requireEmailVerification"
                                        checked={websiteFormState.settings.fraudDetectionSettings?.riskBasedActions?.requireEmailVerification || false}
                                        onCheckedChange={(checked: boolean) =>
                                            handleWebsiteSettingsChange('fraudDetectionSettings', {
                                                ...websiteFormState.settings.fraudDetectionSettings,
                                                riskBasedActions: {
                                                    ...websiteFormState.settings.fraudDetectionSettings?.riskBasedActions,
                                                    requireEmailVerification: checked,
                                                },
                                            })
                                        }
                                    />
                                    <Label htmlFor="requireEmailVerification">Require Email Verification</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="disableCOD"
                                        checked={websiteFormState.settings.fraudDetectionSettings?.riskBasedActions?.disableCOD || false}
                                        onCheckedChange={(checked: boolean) =>
                                            handleWebsiteSettingsChange('fraudDetectionSettings', {
                                                ...websiteFormState.settings.fraudDetectionSettings,
                                                riskBasedActions: {
                                                    ...websiteFormState.settings.fraudDetectionSettings?.riskBasedActions,
                                                    disableCOD: checked,
                                                },
                                            })
                                        }
                                    />
                                    <Label htmlFor="disableCOD">Disable Cash on Delivery (COD)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="showCaptcha"
                                        checked={websiteFormState.settings.fraudDetectionSettings?.riskBasedActions?.showCaptcha || false}
                                        onCheckedChange={(checked: boolean) =>
                                            handleWebsiteSettingsChange('fraudDetectionSettings', {
                                                ...websiteFormState.settings.fraudDetectionSettings,
                                                riskBasedActions: {
                                                    ...websiteFormState.settings.fraudDetectionSettings?.riskBasedActions,
                                                    showCaptcha: checked,
                                                },
                                            })
                                        }
                                    />
                                    <Label htmlFor="showCaptcha">Show CAPTCHA</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="manualReview"
                                        checked={websiteFormState.settings.fraudDetectionSettings?.riskBasedActions?.manualReview || false}
                                        onCheckedChange={(checked: boolean) =>
                                            handleWebsiteSettingsChange('fraudDetectionSettings', {
                                                ...websiteFormState.settings.fraudDetectionSettings,
                                                riskBasedActions: {
                                                    ...websiteFormState.settings.fraudDetectionSettings?.riskBasedActions,
                                                    manualReview: checked,
                                                },
                                            })
                                        }
                                    />
                                    <Label htmlFor="manualReview">Require Manual Review</Label>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="limitOrderValue">Limit Order Value (USD)</Label>
                                    <Input
                                        id="limitOrderValue"
                                        type="number"
                                        value={websiteFormState.settings.fraudDetectionSettings?.riskBasedActions?.limitOrderValue || ''}
                                        onChange={(e) =>
                                            handleWebsiteSettingsChange('fraudDetectionSettings', {
                                                ...websiteFormState.settings.fraudDetectionSettings,
                                                riskBasedActions: {
                                                    ...websiteFormState.settings.fraudDetectionSettings?.riskBasedActions,
                                                    limitOrderValue: Number(e.target.value),
                                                },
                                            })
                                        }
                                        placeholder="e.g., 5000"
                                    />
                                </div>
                            </div>
                        <Button onClick={handleSaveWebsiteSettings} disabled={websiteLoading}>Save Fraud Settings</Button>
                    </CardContent>
                </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>Manage how you receive notifications.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive email notifications for important events.
                                    </p>
                                </div>
                                <Checkbox
                                    id="emailNotifications"
                                    checked={profileFormState.settings?.emailNotificationsEnabled || false}
                                    onCheckedChange={(checked: boolean) => handleProfileSettingsChange('emailNotificationsEnabled', checked)}
                                    disabled={authLoading}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Push Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive push notifications on your devices.
                                    </p>
                                </div>
                                <Checkbox
                                    id="pushNotifications"
                                    checked={profileFormState.settings?.pushNotificationsEnabled || false}
                                    onCheckedChange={(checked: boolean) => handleProfileSettingsChange('pushNotificationsEnabled', checked)}
                                    disabled={authLoading}
                                />
                            </div>
                            <Button onClick={handleSaveNotifications} disabled={authLoading}>Save Notification Settings</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
