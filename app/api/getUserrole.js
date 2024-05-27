import { supabase } from '../../supabaseClient';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { userId } = req.body;
        
        const { data: profileData, error } = await supabase
            .from('profiles')
            .select('roles')
            .eq('id', userId)
            .single();
        
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        
        return res.status(200).json({ role: profileData.roles });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}